-- Create cars table
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('electric', 'petrol', 'diesel')),
  mileage INTEGER,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  engine TEXT NOT NULL,
  transmission TEXT NOT NULL,
  exterior_color TEXT NOT NULL,
  interior_color TEXT NOT NULL,
  vin TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Anyone can view cars (public listings)
CREATE POLICY "Anyone can view cars"
ON public.cars
FOR SELECT
USING (true);

-- Only admins can insert cars
CREATE POLICY "Admins can insert cars"
ON public.cars
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update cars
CREATE POLICY "Admins can update cars"
ON public.cars
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete cars
CREATE POLICY "Admins can delete cars"
ON public.cars
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();