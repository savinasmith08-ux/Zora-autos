import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { InquiryChat } from "@/components/InquiryChat";
import { ReservationDeposit } from "@/components/ReservationDeposit";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadRow {
  id: string;
  user_id: string;
  car_id: string;
  last_message_at: string;
  car?: { make: string; model: string; year: number; image_url: string; price: number } | null;
}

export function Inquiries() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const selected = params.get("thread");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (adminLoading) return;
    setLoading(true);
    supabase
      .from("inquiry_threads")
      .select("id,user_id,car_id,last_message_at, car:cars(make,model,year,image_url)")
      .order("last_message_at", { ascending: false })
      .then(({ data }) => {
        setThreads((data as any) || []);
        setLoading(false);
      });

    const refetch = () => {
      supabase
        .from("inquiry_threads")
        .select("id,user_id,car_id,last_message_at, car:cars(make,model,year,image_url)")
        .order("last_message_at", { ascending: false })
        .then(({ data }) => setThreads((data as any) || []));
    };

    // Only admins can subscribe to the global threads channel.
    // Regular users get updates via their personal notification channel.
    const channelName = isAdmin
      ? "inquiry-threads-list"
      : `notif:inquiry-messages:${userId ?? "anon"}`;

    const ch = supabase
      .channel(channelName, { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiry_threads" }, refetch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inquiry_messages" }, refetch)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [adminLoading, isAdmin, userId]);


  if (!userId || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{isAdmin ? "All Inquiries" : "My Conversations"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setParams({ thread: t.id })}
                className={cn(
                  "w-full text-left p-3 rounded-md hover:bg-accent flex gap-3 items-center transition-colors",
                  selected === t.id && "bg-accent"
                )}
              >
                {t.car?.image_url && (
                  <img src={t.car.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {t.car ? `${t.car.year} ${t.car.make} ${t.car.model}` : "Listing"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.last_message_at).toLocaleString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </Card>

        <div>
          {selected ? (
            <div className="space-y-3">
              {(() => {
                const t = threads.find((x) => x.id === selected);
                return (
                  <ReservationDeposit
                    threadId={selected}
                    isAdmin={isAdmin}
                    carPrice={t?.car?.price}
                    carLabel={t?.car ? `${t.car.year} ${t.car.make} ${t.car.model}` : undefined}
                  />
                );
              })()}
              <InquiryChat threadId={selected} currentUserId={userId} isAdmin={isAdmin} />
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground h-[60vh] flex flex-col items-center justify-center">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p>Select a conversation to start chatting.</p>
              {!isAdmin && (
                <p className="text-xs mt-2">
                  Browse <Link to="/cars" className="text-primary underline">cars</Link> and tap "Message Seller" to start one.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
