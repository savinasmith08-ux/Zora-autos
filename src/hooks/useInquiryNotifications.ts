import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

// Simple chime synthesized via WebAudio (no asset needed)
function playChime() {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* ignore */
  }
}

export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function useInquiryNotifications() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const uid = data.user?.id;
      if (!uid) return;
      userIdRef.current = uid;

      channel = supabase
        .channel(`notif:inquiry-messages:${uid}`, { config: { private: true } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "inquiry_messages" },
          async (payload) => {
            const msg = payload.new as {
              id: string;
              thread_id: string;
              sender_id: string;
              body: string;
            };
            if (msg.sender_id === userIdRef.current) return;

            // Verify the user is allowed to see this thread (RLS-safe extra check).
            // Admin sees all; user only own threads.
            if (!isAdmin) {
              const { data: t } = await supabase
                .from("inquiry_threads")
                .select("id")
                .eq("id", msg.thread_id)
                .maybeSingle();
              if (!t) return;
            }

            // Skip if user is already on that conversation
            const onThread =
              window.location.pathname.startsWith("/inquiries") &&
              new URLSearchParams(window.location.search).get("thread") === msg.thread_id;
            if (onThread && !document.hidden) return;

            playChime();

            const title = isAdmin ? "New customer message" : "New message from Zora Autos";
            const body = msg.body.length > 120 ? msg.body.slice(0, 117) + "…" : msg.body;

            if ("Notification" in window && Notification.permission === "granted") {
              try {
                const n = new Notification(title, { body, tag: msg.thread_id });
                n.onclick = () => {
                  window.focus();
                  navigate(`/inquiries?thread=${msg.thread_id}`);
                  n.close();
                };
              } catch {
                /* ignore */
              }
            }

            toast.message(title, {
              description: body,
              action: {
                label: "Open",
                onClick: () => navigate(`/inquiries?thread=${msg.thread_id}`),
              },
            });
          }
        )
        .subscribe();
    });

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [adminLoading, isAdmin, navigate]);
}
