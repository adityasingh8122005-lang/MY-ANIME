import { supabase } from './supabase';


async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}

export async function getNotes(malId) {
   const userId = await getUserId();
   if (!userId) return [];
   
   let query = supabase.from('anime_notes').select('*').eq('user_id', userId);
   if (malId) query = query.eq('mal_id', malId);
   
   const { data, error } = await query.order('created_at', { ascending: false });
   if (error) {
      console.error(error);
      return [];
   }
   return data;
}

export async function saveNote(malId, episode, content, id = null) {
   const userId = await getUserId();
   if (!userId) throw new Error("Not authenticated");
   
   const payload = {
      user_id: userId,
      mal_id: Number(malId),
      episode: episode ? Number(episode) : null,
      content,
      updated_at: new Date().toISOString()
   };
   
   if (id) {
      const { data, error } = await supabase.from('anime_notes').update(payload).eq('id', id).eq('user_id', userId).select().single();
      if (error) throw error;
      return data;
   } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabase.from('anime_notes').insert(payload).select().single();
      if (error) throw error;
      return data;
   }
}

export async function deleteNote(id) {
   const userId = await getUserId();
   if (!userId) return;
   
   const { error } = await supabase.from('anime_notes').delete().eq('id', id).eq('user_id', userId);
   if (error) throw error;
}
