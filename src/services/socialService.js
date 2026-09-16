import { supabase } from './supabase.js';

// ---- Theories ----
export async function getTheories(malId) {
  const { data, error } = await supabase
    .from('anime_theories')
    .select(`
      *,
      profiles!anime_theories_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .eq('mal_id', Number(malId))
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching theories:', error);
    return [];
  }
  return data;
}

export async function addTheory(malId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { data, error } = await supabase
    .from('anime_theories')
    .insert({
      mal_id: Number(malId),
      user_id: user.id,
      content,
      upvotes: 0
    })
    .select(`
      *,
      profiles!anime_theories_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteTheory(id) {
  const { error } = await supabase
    .from('anime_theories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- Comments ----
export async function getComments(malId) {
  const { data, error } = await supabase
    .from('anime_comments')
    .select(`
      *,
      profiles!anime_comments_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .eq('mal_id', Number(malId))
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data;
}

export async function addComment(malId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { data, error } = await supabase
    .from('anime_comments')
    .insert({
      mal_id: Number(malId),
      user_id: user.id,
      content
    })
    .select(`
      *,
      profiles!anime_comments_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase
    .from('anime_comments')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- Chat ----
export async function getRecentChat(malId) {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('anime_chat')
    .select(`
      *,
      profiles!anime_chat_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .eq('mal_id', Number(malId))
    .gte('created_at', fifteenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('Error fetching chat:', error);
    return [];
  }
  return data.reverse();
}

export async function sendChatMessage(malId, message) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { data, error } = await supabase
    .from('anime_chat')
    .insert({
      mal_id: Number(malId),
      user_id: user.id,
      message
    })
    .select(`
      *,
      profiles!anime_chat_user_id_fkey (
        username,
        avatar_url,
        role
      )
    `)
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteChatMessage(id) {
  const { error } = await supabase
    .from('anime_chat')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- Admin Functions ----
export async function getTotalUsersCount() {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count;
}
