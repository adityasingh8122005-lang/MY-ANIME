import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // On success, typically auto logs in or asks to check email.
        // If auto logged in, the onAuthStateChange in context handles the rest.
        alert('Account created! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/'); // Go home on successful login
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-dark-surface border border-zinc-800 rounded-lg shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent font-mono mb-2">MY AN!ME</h1>
        <p className="text-zinc-400">
          {isSignUp ? 'Create your cloud account' : 'Sign in to access your collection'}
        </p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-md text-sm flex items-start gap-2 mb-6">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded-md py-2 pl-10 pr-3 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded-md py-2 pl-10 pr-3 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-4 border border-accent/50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="ml-2 text-accent hover:underline font-medium"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
