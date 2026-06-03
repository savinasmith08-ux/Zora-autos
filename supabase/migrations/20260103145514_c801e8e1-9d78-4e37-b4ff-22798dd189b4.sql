-- Create table for user car submissions
CREATE TABLE public.car_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER,
  condition TEXT NOT NULL DEFAULT 'used',
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL DEFAULT 'automatic',
  is_hybrid BOOLEAN DEFAULT false,
  asking_price NUMERIC NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_submissions ENABLE ROW LEVEL SECURITY;

-- Users can submit cars (anyone authenticated)
CREATE POLICY "Authenticated users can submit cars"
ON public.car_submissions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.car_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.car_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.car_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.car_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_car_submissions_updated_at
BEFORE UPDATE ON public.car_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();