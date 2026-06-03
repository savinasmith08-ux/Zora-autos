-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true);

-- Allow admins to upload car images
CREATE POLICY "Admins can upload car images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'car-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update car images
CREATE POLICY "Admins can update car images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'car-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete car images
CREATE POLICY "Admins can delete car images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'car-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to car images
CREATE POLICY "Public can view car images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'car-images');