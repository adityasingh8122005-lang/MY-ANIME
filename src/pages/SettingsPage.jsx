import { useState, useRef, useEffect } from 'react';
import { exportUserData, importUserData } from '../services/userService';
import { Download, Upload, Settings as SettingsIcon, AlertTriangle, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export default function SettingsPage() {
  const { session, profile, setProfile } = useAuth();
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [homePreference, setHomePreference] = useState('trending');
  const [isPublic, setIsPublic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setHomePreference(profile.home_preference || 'trending');
      setIsPublic(profile.is_public || false);
    }
  }, [profile]);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showMessage("Username is required", true);
      return;
    }
    const cleanUsername = username.trim().replace('@', '');

    setSavingProfile(true);
    try {
      // Check if username is taken by someone else
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', session.user.id)
        .maybeSingle();

      if (existing) {
        showMessage("Username is already taken!", true);
        setSavingProfile(false);
        return;
      }

      const updates = {
        id: session.user.id,
        username: cleanUsername,
        avatar_url: avatarUrl,
        home_preference: homePreference,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('profiles').upsert(updates).select().single();
      if (error) throw error;
      
      setProfile(data);
      showMessage("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      showMessage("Failed to save profile.", true);
    }
    setSavingProfile(false);
  };

  const handleExport = async () => {
    showMessage("Export is now handled via the cloud.", true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    showMessage("Import is temporarily disabled for cloud migration.", true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-8">
        <SettingsIcon className="text-accent" /> Settings
      </h1>

      {message && (
        <div className={`p-3 mb-6 rounded-md text-sm flex items-center gap-2 \${isError ? 'bg-red-950/50 text-red-400 border border-red-900' : 'bg-green-950/50 text-green-400 border border-green-900'}`}>
          {isError && <AlertTriangle size={16} />}
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <UserCircle className="text-zinc-400" /> Public Profile
        </h2>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Username</label>
            <div className="flex bg-dark-base border border-zinc-700 rounded-md overflow-hidden focus-within:border-accent transition-colors">
              <span className="px-3 py-2 bg-zinc-800 text-zinc-400 border-r border-zinc-700">@</span>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-transparent py-2 px-3 text-white focus:outline-none"
                placeholder="aditya_07"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Profile Picture URL</label>
            <input 
              type="text" 
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <hr className="border-zinc-800 my-4" />

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Home Page Preference</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="homePref"
                  value="trending"
                  checked={homePreference === 'trending'}
                  onChange={() => setHomePreference('trending')}
                  className="accent-accent w-4 h-4"
                />
                <span className="text-sm text-zinc-300 group-hover:text-white">Trending Anime</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="homePref"
                  value="collection"
                  checked={homePreference === 'collection'}
                  onChange={() => setHomePreference('collection')}
                  className="accent-accent w-4 h-4"
                />
                <span className="text-sm text-zinc-300 group-hover:text-white">My Collection</span>
              </label>
            </div>
          </div>

          <hr className="border-zinc-800 my-4" />

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Watched Anime Privacy</label>
            <p className="text-sm text-zinc-400 mb-3">
              Controls whether your watching list appears on your public profile URL (<code>/profile/{username || 'username'}</code>).
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="accent-accent w-4 h-4"
                />
                <span className="text-sm text-zinc-300 group-hover:text-white">Private</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="accent-accent w-4 h-4"
                />
                <span className="text-sm text-zinc-300 group-hover:text-white">Public</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={savingProfile}
            className="mt-6 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Logged in as: <strong className="text-zinc-200">{session?.user?.email}</strong>
        </p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-md border border-red-900/50 transition-colors text-sm font-bold"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}
