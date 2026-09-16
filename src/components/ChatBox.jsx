import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getRecentChat, sendChatMessage, deleteChatMessage } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { Send, Trash2 } from 'lucide-react';
import { useLoginModal } from '../contexts/LoginModalContext';

export default function ChatBox({ malId }) {
  const { session, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function fetchChat() {
      const data = await getRecentChat(malId);
      setMessages(data);
      setLoading(false);
      scrollToBottom();
    }
    fetchChat();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat_${malId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'anime_chat', filter: `mal_id=eq.${malId}` }, async (payload) => {
        const newChat = payload.new;
        const { data: userProfile } = await supabase.from('profiles').select('username, avatar_url, role').eq('id', newChat.user_id).single();
        newChat.profiles = userProfile;
        setMessages(prev => [...prev, newChat]);
        scrollToBottom();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'anime_chat', filter: `mal_id=eq.${malId}` }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [malId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!session) {
      openLoginModal();
      return;
    }
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(malId, newMessage);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteChatMessage(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center text-zinc-500 py-4">Loading chat...</div>;

  return (
    <div className="bg-dark-surface border border-zinc-800 rounded-lg flex flex-col h-[500px]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h3 className="text-white font-bold">Live Discussion</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <p className="text-zinc-500 text-center py-10">No messages yet. Be the first to start the discussion!</p>}
        {messages.map(msg => {
          const isOwn = session?.user?.id === msg.user_id;
          const isAdmin = profile?.role === 'admin';
          return (
            <div key={msg.id} className={`flex gap-3 \${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}>
              {msg.profiles?.avatar_url ? (
                <img src={msg.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
              )}
              <div className={`flex flex-col \${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <span className="text-xs text-zinc-500 mb-1">
                  {msg.profiles?.username || 'User'}
                </span>
                <div className={`px-4 py-2 rounded-2xl text-sm \${isOwn ? 'bg-accent text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                  {msg.message}
                </div>
              </div>
              {(isOwn || isAdmin) && (
                <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={session ? "Type a message..." : "Login to chat"}
          className="flex-1 bg-dark-base border border-zinc-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
        />
        <button 
          type={session ? "submit" : "button"}
          onClick={!session ? openLoginModal : undefined}
          className="bg-accent hover:bg-accent-hover text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
