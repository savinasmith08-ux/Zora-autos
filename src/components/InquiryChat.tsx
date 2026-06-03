import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Props {
  threadId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export function InquiryChat({ threadId, currentUserId, isAdmin }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    supabase
      .from("inquiry_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (ignore) return;
        setMessages(data || []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`inquiry:${threadId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inquiry_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id)
              ? prev
              : [...prev, payload.new as Message]
          );
        }
      )
      .subscribe();

    // Mark unread messages as read through a guarded RPC so clients cannot
    // directly update message content, sender, or thread ownership fields.
    (supabase as any).rpc("mark_inquiry_thread_read", { _thread_id: threadId });

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [threadId, isAdmin]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const { error } = await supabase.from("inquiry_messages").insert({
      thread_id: threadId,
      sender_id: currentUserId,
      body: trimmed,
      read_by_admin: isAdmin,
      read_by_user: !isAdmin,
    });
    setSending(false);
    if (!error) setBody("");
  };

  return (
    <div className="flex flex-col h-[60vh] border rounded-lg bg-card">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm pt-8">
            No messages yet — say hello 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words",
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {m.body}
                  <div className={cn("text-[10px] mt-1 opacity-70", mine ? "text-right" : "")}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          maxLength={4000}
          className="resize-none min-h-[40px] max-h-32"
        />
        <Button onClick={send} disabled={!body.trim() || sending} size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
