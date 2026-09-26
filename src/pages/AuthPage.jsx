import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if the URL tells us to default to signup
    const params = new URLSearchParams(location.search);
    
    // Parse Supabase email verification errors from hash
    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setError(decodeURIComponent(hashError).replace(/\+/g, ' '));
        // Clear hash so it doesn't persist on refresh
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    
    // Check for success verification
    if (params.get('verified') === 'true' && !error) {
      setSuccess("Email successfully verified! You can now log in.");
      // Clear param
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    if (params.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [location]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Enforce 8 character password limit on Sign Up
    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters or numbers long.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth?verified=true'
          }
        });
        if (error) throw error;
        
        setShowVerificationPopup(true);
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Check for the unverified email error
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error('Your email is not verified yet. Please check your Gmail inbox and click the verification link sent by Supabase.');
          }
          throw error;
        }
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

      {success && (
        <div className="bg-green-950/50 border border-green-900 text-green-400 p-3 rounded-md text-sm flex items-start gap-2 mb-6">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="email" 
              name="email"
              autoComplete="email"
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
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={isSignUp ? 8 : undefined}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded-md py-2 pl-10 pr-3 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          {isSignUp && (
            <p className="text-xs text-zinc-500 mt-1">Must be at least 8 characters long.</p>
          )}
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
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccess(null);
          }}
          className="ml-2 text-accent hover:underline font-medium"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>

      {/* Verification Popup Modal */}
      {showVerificationPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-elevated border border-zinc-700 rounded-lg max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-sm text-zinc-400 mb-6">
              We've sent a verification link to <strong>{email}</strong>. 
              Please check your inbox (and spam folder) and click the link to verify your account before logging in.
            </p>
            <button 
              onClick={() => {
                setShowVerificationPopup(false);
                setIsSignUp(false);
                setSuccess('Please verify your email before logging in.');
              }}
              className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-md font-bold transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
