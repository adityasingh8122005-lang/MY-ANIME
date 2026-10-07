-- Add personal review fields to user_anime
ALTER TABLE user_anime ADD COLUMN IF NOT EXISTS personal_review text;
ALTER TABLE user_anime ADD COLUMN IF NOT EXISTS review_updated_at timestamp with time zone;

-- Create Anime Notes Table
CREATE TABLE IF NOT EXISTS anime_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mal_id integer NOT NULL,
    episode integer,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security (RLS) for anime_notes
ALTER TABLE anime_notes ENABLE ROW LEVEL SECURITY;

-- Note Security: Strictly private. Only the author can SELECT, INSERT, UPDATE, DELETE.
CREATE POLICY "Notes are private to the author." ON anime_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes." ON anime_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes." ON anime_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes." ON anime_notes FOR DELETE USING (auth.uid() = user_id);
