-- Add new columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_stats_in_navbar boolean DEFAULT true;

-- Create Anime Theories Table
CREATE TABLE IF NOT EXISTS anime_theories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mal_id integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    upvotes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Anime Comments Table
CREATE TABLE IF NOT EXISTS anime_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mal_id integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Anime Chat Table
CREATE TABLE IF NOT EXISTS anime_chat (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mal_id integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security (RLS) for anime_theories
ALTER TABLE anime_theories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Theories are viewable by everyone." ON anime_theories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own theories." ON anime_theories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own theories." ON anime_theories FOR UPDATE USING (auth.uid() = user_id);
-- Allow delete for author or admins
CREATE POLICY "Users or admins can delete theories." ON anime_theories FOR DELETE 
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Set up Row Level Security (RLS) for anime_comments
ALTER TABLE anime_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone." ON anime_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON anime_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow delete for author or admins
CREATE POLICY "Users or admins can delete comments." ON anime_comments FOR DELETE 
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Set up Row Level Security (RLS) for anime_chat
ALTER TABLE anime_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat messages are viewable by everyone." ON anime_chat FOR SELECT USING (true);
CREATE POLICY "Users can insert their own chat messages." ON anime_chat FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow delete for author or admins
CREATE POLICY "Users or admins can delete chat messages." ON anime_chat FOR DELETE 
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow REALTIME for chat
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE anime_chat;
