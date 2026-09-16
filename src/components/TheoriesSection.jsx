import React, { useEffect, useState } from 'react';
import { getTheories, addTheory, deleteTheory } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { useLoginModal } from '../contexts/LoginModalContext';
import { Trash2, Lightbulb } from 'lucide-react';

export default function TheoriesSection({ malId }) {
  const { session, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [theories, setTheories] = useState([]);
  const [newTheory, setNewTheory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getTheories(malId);
      setTheories(data);
      setLoading(false);
    }
    load();
  }, [malId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      openLoginModal();
      return;
    }
    if (!newTheory.trim()) return;

    setSubmitting(true);
    try {
      const added = await addTheory(malId, newTheory);
      setTheories([added, ...theories]);
      setNewTheory('');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTheory(id);
      setTheories(theories.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-zinc-500 py-4">Loading theories...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg flex gap-3 items-start">
        <Lightbulb className="text-purple-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-purple-100 font-bold mb-1">Fan Theories</h3>
          <p className="text-purple-300 text-sm">Share your predictions and theories about what will happen next! Remember to tag any manga spoilers if applicable.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 items-start">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <textarea
            value={newTheory}
            onChange={e => setNewTheory(e.target.value)}
            placeholder={session ? "Write your theory..." : "Login to write a theory"}
            className="w-full bg-dark-surface border border-purple-500/30 rounded-md p-3 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
          />
          <button 
            type={session ? "submit" : "button"}
            onClick={!session ? openLoginModal : undefined}
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Theory'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {theories.map(t => {
          const isOwn = session?.user?.id === t.user_id;
          const isAdmin = profile?.role === 'admin';
          return (
            <div key={t.id} className="bg-dark-surface border border-zinc-800 rounded-lg p-5 group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {t.profiles?.avatar_url ? (
                    <img src={t.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  )}
                  <div>
                    <div className="font-bold text-white text-sm">
                      {t.profiles?.username || 'User'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {(isOwn || isAdmin) && (
                  <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed">{t.content}</p>
            </div>
          );
        })}
        {theories.length === 0 && <p className="text-zinc-500 text-center py-8">No theories yet. Be the first!</p>}
      </div>
    </div>
  );
}
