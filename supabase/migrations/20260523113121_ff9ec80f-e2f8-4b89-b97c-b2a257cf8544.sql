
-- Reservations: remove user INSERT capability; only service role (edge function) can insert
DROP POLICY IF EXISTS "Users insert own reservations" ON public.reservations;

CREATE POLICY "Direct reservation inserts disabled"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Inquiry threads: allow owners and admins to delete
CREATE POLICY "Owner or admin delete thread"
ON public.inquiry_threads
FOR DELETE
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
