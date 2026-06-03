-- Ensure car submissions are always owned by the authenticated submitter
ALTER TABLE public.car_submissions
  ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Authenticated users can submit cars" ON public.car_submissions;

CREATE POLICY "Authenticated users can submit their own cars"
ON public.car_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Prevent direct client updates to inquiry message content or attribution
DROP POLICY IF EXISTS "Owner or admin marks read" ON public.inquiry_messages;
REVOKE UPDATE ON public.inquiry_messages FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_inquiry_thread_read(_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _owns_thread boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT public.has_role(auth.uid(), 'admin'::public.app_role) INTO _is_admin;
  SELECT EXISTS (
    SELECT 1
    FROM public.inquiry_threads
    WHERE id = _thread_id
      AND user_id = auth.uid()
  ) INTO _owns_thread;

  IF NOT (_is_admin OR _owns_thread) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF _is_admin THEN
    UPDATE public.inquiry_messages
    SET read_by_admin = true
    WHERE thread_id = _thread_id
      AND read_by_admin = false;
  ELSE
    UPDATE public.inquiry_messages
    SET read_by_user = true
    WHERE thread_id = _thread_id
      AND read_by_user = false;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_inquiry_thread_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_inquiry_thread_read(uuid) TO authenticated;

-- Explicit admin-only policies for the private Information bucket
DROP POLICY IF EXISTS "Admins can view Information files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload Information files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update Information files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete Information files" ON storage.objects;

CREATE POLICY "Admins can view Information files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'Information' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can upload Information files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Information' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update Information files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Information' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'Information' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete Information files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Information' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict private Realtime channel access to approved inquiry topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated inquiry realtime channels" ON realtime.messages;

CREATE POLICY "Authenticated inquiry realtime channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'inquiry-threads-list'
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