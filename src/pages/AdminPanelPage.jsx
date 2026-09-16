import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, MessageSquare, Trash2, MessageCircle } from 'lucide-react';
import { getTotalUsersCount } from '../services/socialService';
import { supabase } from '../services/supabase';

export default function AdminPanelPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [recentTheories, setRecentTheories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const usersCount = await getTotalUsersCount();
      setTotalUsers(usersCount);

      const [{ data: chats }, { data: comments }, { data: theories }] = await Promise.all([
        supabase.from('anime_chat').select('*, profiles!anime_chat_user_id_fkey(username)').order('created_at', { ascending: false }).limit(10),
        supabase.from('anime_comments').select('*, profiles!anime_comments_user_id_fkey(username)').order('created_at', { ascending: false }).limit(10),
        supabase.from('anime_theories').select('*, profiles!anime_theories_user_id_fkey(username)').order('created_at', { ascending: false }).limit(10),
      ]);

      setRecentChats(chats || []);
      setRecentComments(comments || []);
      setRecentTheories(theories || []);
      setLoading(false);
    }
    loadStats();
  }, []);

  const deleteChat = async (id) => {
    await supabase.from('anime_chat').delete().eq('id', id);
    setRecentChats(c => c.filter(x => x.id !== id));
  };
  const deleteComment = async (id) => {
    await supabase.from('anime_comments').delete().eq('id', id);
    setRecentComments(c => c.filter(x => x.id !== id));
  };
  const deleteTheory = async (id) => {
    await supabase.from('anime_theories').delete().eq('id', id);
    setRecentTheories(c => c.filter(x => x.id !== id));
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading Admin Panel...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> Head Admin Panel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <Users size={32} className="text-accent mb-2" />
          <h2 className="text-zinc-400 text-sm font-semibold uppercase">Total Users</h2>
          <p className="text-3xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <MessageCircle size={32} className="text-green-500 mb-2" />
          <h2 className="text-zinc-400 text-sm font-semibold uppercase">Total Chats</h2>
          <p className="text-3xl font-bold text-white">Live</p>
        </div>
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <MessageSquare size={32} className="text-purple-500 mb-2" />
          <h2 className="text-zinc-400 text-sm font-semibold uppercase">Moderation</h2>
          <p className="text-3xl font-bold text-white">Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Chats</h2>
          <div className="space-y-3">
            {recentChats.map(chat => (
              <div key={chat.id} className="bg-dark-surface border border-zinc-800 rounded p-3 flex justify-between items-start gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">@{chat.profiles?.username || 'user'} • Anime {chat.mal_id}</div>
                  <div className="text-sm text-zinc-200 break-words">{chat.message}</div>
                </div>
                <button onClick={() => deleteChat(chat.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {recentChats.length === 0 && <p className="text-zinc-500 text-sm">No recent chats.</p>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Comments & Theories</h2>
          <div className="space-y-3">
            {recentComments.map(c => (
              <div key={c.id} className="bg-dark-surface border border-zinc-800 rounded p-3 flex justify-between items-start gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Comment by @{c.profiles?.username || 'user'} • Anime {c.mal_id}</div>
                  <div className="text-sm text-zinc-200 break-words">{c.content}</div>
                </div>
                <button onClick={() => deleteComment(c.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {recentTheories.map(t => (
              <div key={t.id} className="bg-dark-surface border border-zinc-800 rounded p-3 flex justify-between items-start gap-4">
                <div>
                  <div className="text-xs text-purple-500 mb-1">Theory by @{t.profiles?.username || 'user'} • Anime {t.mal_id}</div>
                  <div className="text-sm text-zinc-200 break-words">{t.content}</div>
                </div>
                <button onClick={() => deleteTheory(t.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {recentComments.length === 0 && recentTheories.length === 0 && <p className="text-zinc-500 text-sm">No recent comments or theories.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
