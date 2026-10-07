import { supabase } from './supabase';

export async function getCustomCollections() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('custom_collections')
    .select('*, custom_collection_items(franchise_id)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("getCustomCollections Error:", error);
    return []; // Return empty array gracefully if table is missing or errors
  }

  return data.map(c => ({
    ...c,
    items: c.custom_collection_items?.map(i => i.franchise_id) || []
  }));
}

export async function createCustomCollection(name, description = "") {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in.");

  const { data, error } = await supabase
    .from('custom_collections')
    .insert([{ user_id: session.user.id, name, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCustomCollection(id, name, description) {
  const { error } = await supabase
    .from('custom_collections')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCustomCollection(id) {
  const { error } = await supabase
    .from('custom_collections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function addFranchiseToCustomCollection(collectionId, franchiseId) {
  const { error } = await supabase
    .from('custom_collection_items')
    .insert([{ collection_id: collectionId, franchise_id: franchiseId }]);

  if (error) {
     if (error.code === '23505') return; // Ignore unique constraint duplicate insertions
     throw error;
  }
}

export async function removeFranchiseFromCustomCollection(collectionId, franchiseId) {
  const { error } = await supabase
    .from('custom_collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('franchise_id', franchiseId);

  if (error) throw error;
}

export async function getCustomCollectionHistory() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  
  const { data, error } = await supabase
    .from('custom_collection_items')
    .select('collection_id, franchise_id, created_at, custom_collections!inner(name, user_id)')
    .eq('custom_collections.user_id', session.user.id);
    
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}
