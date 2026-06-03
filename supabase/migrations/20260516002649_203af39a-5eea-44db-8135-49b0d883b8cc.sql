
-- Remove sensitive tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.car_submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;

-- Allow authenticated users to upload submission images
CREATE POLICY "Authenticated users can upload submission images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'submissions'
);
