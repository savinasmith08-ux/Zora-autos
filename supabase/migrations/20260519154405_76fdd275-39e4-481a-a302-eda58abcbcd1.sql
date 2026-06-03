
-- 1. Reservations: lock down writes (only edge functions via service role should write)
CREATE POLICY "Users insert own reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Contact messages: force submission through edge function (which uses service role)
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Direct contact inserts disabled"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (false);

-- 3. Realtime: restrict 'inquiry-threads-list' channel to admins only
DROP POLICY IF EXISTS "Authenticated inquiry realtime channels" ON realtime.messages;

CREATE POLICY "Authenticated inquiry realtime channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() = 'inquiry-threads-list'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  OR (
    realtime.topic() = ('notif:inquiry-messages:' || auth.uid()::text)
  )
  OR (
    realtime.topic() LIKE 'inquiry:%'
    AND EXISTS (
      SELECT 1
      FROM public.inquiry_threads t
      WHERE t.id::text = split_part(realtime.topic(), ':', 2)
        AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  )
);
