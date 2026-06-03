
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  car_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  deposit_pct numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_thread ON public.reservations(thread_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all reservations"
ON public.reservations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
