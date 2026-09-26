import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(() => {
    return localStorage.getItem('myanime_admin_mode') === 'true';
  });

  const checkAdmin = (sess) => {
    if (!sess?.user?.email) return false;
    const adminEmails = ['iamaditya8090@gmail.com'];
    return adminEmails.includes(sess.user.email);
  };

  const toggleAdminMode = () => {
    setAdminMode(prev => {
      const next = !prev;
      localStorage.setItem('myanime_admin_mode', String(next));
      return next;
    });
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      const isAdm = checkAdmin(session);
      setIsAdmin(isAdm);
      if (!isAdm) {
        setAdminMode(false);
        localStorage.removeItem('myanime_admin_mode');
      }
      
      if (session?.user?.id) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      const isAdm = checkAdmin(session);
      setIsAdmin(isAdm);
      if (!isAdm) {
        setAdminMode(false);
        localStorage.removeItem('myanime_admin_mode');
      }

      if (session?.user?.id) fetchProfile(session.user.id).then(() => setLoading(false));
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user, profile, setProfile, loading, isAdmin, adminMode, toggleAdminMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
