-- PinkSnap Database Schema, Profiles, Roles, and Row Level Security (RLS)

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [M4] Added SET search_path to prevent search-path hijacking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all old policies to eliminate recursion
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow select for everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for self or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for self or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete for admin" ON public.profiles;
-- Drop the new split policies in case of re-run
DROP POLICY IF EXISTS "Allow select own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow self update without role change" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full update" ON public.profiles;

-- [H2] Restrict profiles SELECT to own row or admin (was: USING (true))
CREATE POLICY "Allow select own profile or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow insert for self or admin" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- [C2] Split UPDATE into two policies:
-- Regular users can update their own row but CANNOT change their role
CREATE POLICY "Allow self update without role change"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admins can update any profile including role changes
CREATE POLICY "Allow admin full update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow delete for admin" 
  ON public.profiles FOR DELETE 
  USING (public.is_admin());

-- [H2] Public view for chat: exposes only non-sensitive fields, readable by authenticated users
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, display_name, avatar_url, role
FROM public.profiles;

-- Grant authenticated users read access to the view
GRANT SELECT ON public.profiles_public TO authenticated;

-- 4. Create memories (photo strips) table linked to auth.users
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT 'vertical-4',
  frame TEXT NOT NULL DEFAULT 'classic',
  filter TEXT NOT NULL DEFAULT 'color',
  mime_type TEXT DEFAULT 'image/jpeg',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Drop existing memories policies
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;
DROP POLICY IF EXISTS "Admins can view all memories" ON public.memories;

-- Memories RLS Policies
CREATE POLICY "Users can view their own memories"
  ON public.memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own memories"
  ON public.memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 5. Trigger to automatically create a profile entry when a new user signs up
-- [C1] Always assign 'user' role — never trust client-supplied metadata for role
-- [M4] Added SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
      new.id,
      COALESCE(new.email, ''),
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(COALESCE(new.email, ''), '@', 1), 'User'),
      'user'::user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from ever blocking Supabase Auth signup
    RAISE WARNING 'handle_new_user profile creation warning: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Backfill all existing users from auth.users into public.profiles
-- [C1] Always assign 'user' role on backfill — do not trust metadata
INSERT INTO public.profiles (id, email, display_name, role)
SELECT 
  id, 
  COALESCE(email, ''), 
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'User'),
  'user'::user_role
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_messages_room_created_at 
  ON public.community_messages (room, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_community_messages_user_id 
  ON public.community_messages (user_id);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read community messages for all" ON public.community_messages;
DROP POLICY IF EXISTS "Allow read community messages for authenticated" ON public.community_messages;
DROP POLICY IF EXISTS "Allow authenticated users to send community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Allow author or admin to delete community messages" ON public.community_messages;

-- [H3] Restrict chat SELECT to authenticated users (was: USING (true) for everyone)
CREATE POLICY "Allow read community messages for authenticated" 
  ON public.community_messages FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to send community messages" 
  ON public.community_messages FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow author or admin to delete community messages" 
  ON public.community_messages FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- [M4] Added SET search_path
CREATE OR REPLACE FUNCTION public.check_community_message_rate_limit()
RETURNS trigger AS $$
DECLARE
  recent_count integer;
  last_created timestamptz;
  last_msg text;
BEGIN
  SELECT created_at, content INTO last_created, last_msg
  FROM public.community_messages
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_created IS NOT NULL AND (now() - last_created) < interval '2.5 seconds' THEN
    RAISE EXCEPTION 'Rate limit exceeded: Please wait a few seconds before sending another message.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.community_messages
  WHERE user_id = NEW.user_id
    AND created_at >= (now() - interval '15 seconds');

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You are sending messages too quickly. Please wait a moment.'
      USING ERRCODE = 'P0001';
  END IF;

  IF last_msg IS NOT NULL AND lower(trim(NEW.content)) = lower(trim(last_msg)) AND (now() - last_created) < interval '30 seconds' THEN
    RAISE EXCEPTION 'Duplicate message rejected: Please avoid sending repeated duplicate messages.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_check_community_message_rate_limit ON public.community_messages;
CREATE TRIGGER tr_check_community_message_rate_limit
  BEFORE INSERT ON public.community_messages
  FOR EACH ROW EXECUTE PROCEDURE public.check_community_message_rate_limit();

-- [M2] Expanded server-side content filter to include profanities (not just slurs)
-- [M4] Added SET search_path
CREATE OR REPLACE FUNCTION public.check_community_message_content()
RETURNS trigger AS $$
DECLARE
  cleaned text;
  normalized text;
BEGIN
  NEW.content := trim(NEW.content);
  
  IF char_length(NEW.content) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty.' USING ERRCODE = 'P0002';
  END IF;

  IF char_length(NEW.content) > 300 THEN
    RAISE EXCEPTION 'Message content exceeds maximum allowed length of 300 characters.' USING ERRCODE = 'P0002';
  END IF;

  cleaned := lower(NEW.content);
  cleaned := translate(cleaned, '@$01!3745', 'asoiieats');
  normalized := regexp_replace(cleaned, '[^a-z0-9]', '', 'g');

  -- Slurs and hate speech (block completely)
  IF normalized ~* '(n+i+[gq]+[e3a]+r*|f+a+g+[o0e]*t*|k+y+s|k+i+k+e|c+h+i+n+k|g+o+o+k|s+p+i+c|d+y+k+e|t+r+a+n+n+y|r+e+t+a+r+d)' OR
     cleaned ~* '\y(nigger|nigga|faggot|fag|kike|chink|gook|spic|beaner|wetback|tranny|shemale|retard|kys|kill\s+yourself)\y' THEN
    RAISE EXCEPTION 'Message rejected: Contains prohibited slurs or hate speech.' USING ERRCODE = 'P0002';
  END IF;

  -- [M2] Profanities (also block server-side to prevent bypass via direct API calls)
  IF cleaned ~* '\y(fuck|fucking|fucker|fucked|shit|bitch|bitches|cunt|cock|pussy|whore|slut|asshole|bastard|motherfucker|twat|wanker|prick)\y' THEN
    RAISE EXCEPTION 'Message rejected: Contains profanity. Please keep the chat friendly.' USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_check_community_message_content ON public.community_messages;
CREATE TRIGGER tr_check_community_message_content
  BEFORE INSERT OR UPDATE ON public.community_messages
  FOR EACH ROW EXECUTE PROCEDURE public.check_community_message_content();
