-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add UPDATE policy for orders (users can update shipping address within 1 hour)
CREATE POLICY "Users can update shipping within 1 hour"
ON public.orders
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND created_at > now() - interval '1 hour'
)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins and staff to update any order
CREATE POLICY "Admins and staff can update orders"
ON public.orders
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
);

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins and staff to add tracking updates
CREATE POLICY "Admins and staff can add tracking updates"
ON public.tracking_updates
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
);

-- Allow admins and staff to view all tracking updates
CREATE POLICY "Admins and staff can view all tracking updates"
ON public.tracking_updates
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
);

-- Allow admins to view contact messages
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Set default customer role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

-- Trigger to automatically assign customer role on signup
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();