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
  const [showStatsInNavbar, setShowStatsInNavbar] = useState(true);
  const [showNonCanonMovies, setShowNonCanonMovies] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setHomePreference(profile.home_preference || 'trending');
      setIsPublic(profile.is_public || false);
      setShowStatsInNavbar(profile.show_stats_in_navbar !== false);
      setShowNonCanonMovies(profile.show_non_canon_movies === true);
      setIsAdminMode(profile.role === 'admin');
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
        show_stats_in_navbar: showStatsInNavbar,
        show_non_canon_movies: showNonCanonMovies,
        role: (session.user.email === 'iamaditya8090@gmail.com' && isAdminMode) ? 'admin' : 'user',
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
            <p className="text-xs text-zinc-500 mt-1">Username must be unique.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Profile Picture</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border border-zinc-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <UserCircle size={32} className="text-zinc-500" />
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 150;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        setAvatarUrl(dataUrl);
                      };
                      img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                />
                <p className="text-xs text-zinc-500 mt-1">Upload an image from your device.</p>
              </div>
            </div>
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

          <hr className="border-zinc-800 my-4" />

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Display Preferences</label>
                        <p className="text-sm text-zinc-400 mb-3">
              Controls whether the Statistics link is shown in the top navigation bar.
            </p>
            <label className="flex items-center gap-2 cursor-pointer group w-max">
              <input 
                type="checkbox" 
                checked={showStatsInNavbar}
                onChange={(e) => setShowStatsInNavbar(e.target.checked)}
                className="accent-accent w-4 h-4"
              />
              <span className="text-sm text-zinc-300 group-hover:text-white">Show Statistics in Navbar</span>
            </label>
          </div>

          <hr className="border-zinc-800 my-4" />

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Movie Visibility</label>
            <p className="text-sm text-zinc-400 mb-3">
              Controls whether non-canon and filler movies are displayed in Franchise pages.
            </p>
            <label className="flex items-center gap-2 cursor-pointer group w-max">
              <input 
                type="checkbox" 
                checked={showNonCanonMovies}
                onChange={(e) => setShowNonCanonMovies(e.target.checked)}
                className="accent-accent w-4 h-4"
              />
              <span className="text-sm text-zinc-300 group-hover:text-white">Show Filler / Non-Canon Movies</span>
            </label>
          </div>

          {session?.user?.email === 'iamaditya8090@gmail.com' && (
            <>
              <hr className="border-zinc-800 my-4" />
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">System Administrator</label>
                <p className="text-sm text-zinc-400 mb-3">
                  Toggle whether you have admin privileges (moderation and metrics) enabled for this session.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group w-max">
                  <input 
                    type="checkbox" 
                    checked={isAdminMode}
                    onChange={(e) => setIsAdminMode(e.target.checked)}
                    className="accent-red-500 w-4 h-4"
                  />
                  <span className="text-sm text-red-400 group-hover:text-red-300 font-medium">Enable Admin Mode</span>
                </label>
              </div>
            </>
          )}

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
