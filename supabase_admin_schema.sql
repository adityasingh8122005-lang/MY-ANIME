-- 1. Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  current_email text;
BEGIN
  -- Extract email from the authenticated JWT token
  current_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Return true only if it matches your admin emails
  RETURN current_email IN ('iamaditya8090@gmail.com', 'adityasingh8122005@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Profiles RLS
-- (Allows admins to see all registered users for the directory)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin());

-- 3. Update User Anime RLS
-- (Allows admins to see all rows strictly for calculating global popularity statistics)
DROP POLICY IF EXISTS "Admins can view all user anime for stats" ON public.user_anime;
CREATE POLICY "Admins can view all user anime for stats"
ON public.user_anime FOR SELECT
USING (is_admin());

-- 4. Update Chat/Comments RLS for Moderation
DROP POLICY IF EXISTS "Admins can delete any chat" ON public.anime_chat;
CREATE POLICY "Admins can delete any chat"
ON public.anime_chat FOR DELETE
USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any comment" ON public.anime_comments;
CREATE POLICY "Admins can delete any comment"
ON public.anime_comments FOR DELETE
USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any theory" ON public.anime_theories;
CREATE POLICY "Admins can delete any theory"
ON public.anime_theories FOR DELETE
USING (is_admin());
