-- Remove the overly permissive policy since SECURITY DEFINER functions bypass RLS anyway
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;