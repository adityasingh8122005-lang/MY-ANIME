-- Create custom collections table
CREATE TABLE IF NOT EXISTS custom_collections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create custom collection items mapping table
CREATE TABLE IF NOT EXISTS custom_collection_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id uuid REFERENCES custom_collections(id) ON DELETE CASCADE NOT NULL,
    franchise_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(collection_id, franchise_id)
);

-- Enable RLS
ALTER TABLE custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_collections
CREATE POLICY "Users can view their own collections"
    ON custom_collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
    ON custom_collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON custom_collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON custom_collections FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for custom_collection_items
CREATE POLICY "Users can view items in their collections"
    ON custom_collection_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM custom_collections
            WHERE custom_collections.id = custom_collection_items.collection_id
            AND custom_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items into their collections"
    ON custom_collection_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM custom_collections
            WHERE custom_collections.id = custom_collection_items.collection_id
            AND custom_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove items from their collections"
    ON custom_collection_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM custom_collections
            WHERE custom_collections.id = custom_collection_items.collection_id
            AND custom_collections.user_id = auth.uid()
        )
    );
