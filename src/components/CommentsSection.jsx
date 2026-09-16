import React, { useEffect, useState } from 'react';
import { getComments, addComment, deleteComment } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { useLoginModal } from '../contexts/LoginModalContext';
import { Trash2 } from 'lucide-react';

export default function CommentsSection({ malId }) {
  const { session, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getComments(malId);
      setComments(data);
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
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const added = await addComment(malId, newComment);
      setComments([added, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      setComments(comments.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-zinc-500 py-4">Loading comments...</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4 items-start">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={session ? "Add a comment..." : "Login to add a comment"}
            className="w-full bg-dark-surface border border-zinc-700 rounded-md p-3 text-sm text-white focus:outline-none focus:border-accent min-h-[80px]"
          />
          <button 
            type={session ? "submit" : "button"}
            onClick={!session ? openLoginModal : undefined}
            disabled={submitting}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map(c => {
          const isOwn = session?.user?.id === c.user_id;
          const isAdmin = profile?.role === 'admin';
          return (
            <div key={c.id} className="flex gap-4 group">
              {c.profiles?.avatar_url ? (
                <img src={c.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
              )}
              <div className="flex-1 bg-dark-surface border border-zinc-800 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-white text-sm">
                    {c.profiles?.username || 'User'}
                  </div>
                  {(isOwn || isAdmin) && (
                    <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{c.content}</p>
                <div className="text-xs text-zinc-500 mt-2">
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && <p className="text-zinc-500">No comments yet.</p>}
      </div>
    </div>
  );
}
