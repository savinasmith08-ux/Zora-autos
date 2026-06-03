import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  amount_cents: number;
  currency: string;
  deposit_pct: number;
  status: string;
  created_at: string;
}

interface Props {
  threadId: string;
  isAdmin: boolean;
  carPrice?: number | null;
  carLabel?: string;
}

const DEPOSIT_PCT = 5;

export function ReservationDeposit({ threadId, isAdmin, carPrice, carLabel }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = () => {
    supabase
      .from("reservations" as any)
      .select("id, amount_cents, currency, deposit_pct, status, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReservations((data as any) || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    load();
    const ch = supabase
      .channel(`reservations:${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations", filter: `thread_id=eq.${threadId}` },
        () => load()
      )
      .subscribe();

    // If returning from Stripe success URL, verify the payment server-side.
    const url = new URL(window.location.href);
    if (url.searchParams.get("deposit") === "success") {
      supabase.functions.invoke("verify-deposit", { body: { thread_id: threadId } }).then(({ data }) => {
        if ((data as any)?.status === "paid") toast.success("Deposit confirmed — vehicle reserved!");
        load();
      });
      url.searchParams.delete("deposit");
      window.history.replaceState({}, "", url.toString());
    } else if (url.searchParams.get("deposit") === "canceled") {
      toast.info("Checkout canceled.");
      url.searchParams.delete("deposit");
      window.history.replaceState({}, "", url.toString());
    }

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const startCheckout = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-deposit-checkout", {
        body: { thread_id: threadId },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to start checkout");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
      setStarting(false);
    }
  };

  const paid = reservations.find((r) => r.status === "paid");
  const pending = reservations.find((r) => r.status === "pending");
  const depositAmount = carPrice ? (carPrice * DEPOSIT_PCT) / 100 : null;

  if (loading) return null;

  if (paid) {
    return (
      <Card className="p-3 border-green-500/30 bg-green-500/5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium">Reservation deposit paid</div>
          <div className="text-muted-foreground text-xs">
            {paid.currency.toUpperCase()} ${(paid.amount_cents / 100).toFixed(2)} — vehicle reserved
          </div>
        </div>
      </Card>
    );
  }

  if (isAdmin) {
    return (
      <Card className="p-3 bg-muted/30 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="text-sm text-muted-foreground">
          No deposit paid yet for this inquiry.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">Reserve this vehicle</div>
          <div className="text-xs text-muted-foreground mt-1">
            Secure {carLabel || "this car"} with a {DEPOSIT_PCT}% refundable deposit
            {depositAmount ? ` (~$${depositAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })})` : ""}.
          </div>
          {pending && (
            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Previous checkout not completed.
            </div>
          )}
        </div>
        <Button onClick={startCheckout} disabled={starting} size="sm">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay deposit"}
        </Button>
      </div>
    </Card>
  );
}
