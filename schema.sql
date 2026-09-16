-- Run this script in the Supabase SQL Editor

-- 1. Create user_anime table
CREATE TABLE user_anime (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  mal_id integer NOT NULL,
  personal_status text NOT NULL DEFAULT 'Plan to Watch',
  episodes_watched integer DEFAULT 0,
  personal_rating integer,
  franchise_id text,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, mal_id)
);

-- Enable Row Level Security
ALTER TABLE user_anime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own anime" ON user_anime FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anime" ON user_anime FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anime" ON user_anime FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anime" ON user_anime FOR DELETE USING (auth.uid() = user_id);

-- 2. Create watch_history table
CREATE TABLE watch_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  mal_id integer NOT NULL,
  date text NOT NULL,
  episodes_watched integer NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON watch_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON watch_history FOR DELETE USING (auth.uid() = user_id);

-- 3. Create shared anime_metadata table
CREATE TABLE anime_metadata (
  mal_id integer PRIMARY KEY,
  title text NOT NULL,
  english_title text,
  poster text,
  episodes integer,
  status text,
  duration text
);

-- Allow anyone to read and insert (since clients will populate this when adding anime)
-- We don't want strict RLS on metadata, but it requires anon/authenticated to access
ALTER TABLE anime_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view metadata" ON anime_metadata FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert metadata" ON anime_metadata FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update metadata" ON anime_metadata FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Create shared franchises table
CREATE TABLE franchises (
  franchise_id text PRIMARY KEY,
  franchise_name text NOT NULL,
  poster text,
  seasons jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Allow anyone to read and insert
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view franchises" ON franchises FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert franchises" ON franchises FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update franchises" ON franchises FOR UPDATE USING (auth.role() = 'authenticated');
