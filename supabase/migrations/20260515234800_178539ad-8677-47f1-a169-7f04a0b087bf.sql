-- Threads: one per (user, car)
CREATE TABLE public.inquiry_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, car_id)
);

CREATE INDEX idx_inquiry_threads_user ON public.inquiry_threads(user_id);
CREATE INDEX idx_inquiry_threads_car ON public.inquiry_threads(car_id);
CREATE INDEX idx_inquiry_threads_last_msg ON public.inquiry_threads(last_message_at DESC);

ALTER TABLE public.inquiry_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own threads"
ON public.inquiry_threads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all threads"
ON public.inquiry_threads FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own threads"
ON public.inquiry_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or admin update thread"
ON public.inquiry_threads FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Messages
CREATE TABLE public.inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.inquiry_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  read_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_messages_thread ON public.inquiry_messages(thread_id, created_at);

ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread owner reads messages"
ON public.inquiry_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.inquiry_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));

CREATE POLICY "Admins read all messages"
ON public.inquiry_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner sends in own thread"
ON public.inquiry_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.inquiry_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);

CREATE POLICY "Admin sends in any thread"
ON public.inquiry_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owner or admin marks read"
ON public.inquiry_messages FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.inquiry_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);

-- Bump last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inquiry_threads SET last_message_at = NEW.created_at WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_thread_last_message
AFTER INSERT ON public.inquiry_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_thread_last_message();

-- Realtime
ALTER TABLE public.inquiry_threads REPLICA IDENTITY FULL;
ALTER TABLE public.inquiry_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;