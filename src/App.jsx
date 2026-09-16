import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { Navigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from './services/supabase.js';
import { migrateLocalToCloud } from './services/cloudMigration.js';

import { Search, Home, Library, Settings as SettingsIcon, BarChart3, Dices, ShieldAlert } from 'lucide-react';
import SearchPage from './pages/SearchPage.jsx';
import AnimeDetailsPage from './pages/AnimeDetailsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MyAnimePage from './pages/MyAnimePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import SurpriseMePage from './pages/SurpriseMePage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import Notifications from './components/Notifications.jsx';
import FranchiseDetailsPage from './pages/FranchiseDetailsPage.jsx';
import clsx from 'clsx';
import { useEffect, useState, useRef } from 'react';
import { LoginModalProvider, useLoginModal } from './contexts/LoginModalContext.jsx';
import LoginModal from './components/LoginModal.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { UserCircle } from 'lucide-react';

import { db } from './services/db.js';



import { useState, useRef, useEffect as useReactEffect } from 'react';

const HeaderProfile = () => {
  const { session, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  if (!session) {
    return (
      <button onClick={openLoginModal} className="p-1 text-zinc-400 hover:text-white transition-colors" title="Account">
        <UserCircle size={24} />
      </button>
    );
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 shrink-0 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors overflow-hidden w-8 h-8 flex items-center justify-center bg-zinc-800 focus:outline-none"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <UserCircle size={24} className="text-zinc-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-zinc-700 rounded-md shadow-lg py-1 z-50">
          <Link 
            to={profile?.username ? `/profile/${profile.username}` : '/settings'}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <UserCircle size={16} /> Profile
          </Link>
          <Link 
            to="/statistics"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <BarChart3 size={16} /> Statistics
          </Link>
          <Link 
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <SettingsIcon size={16} /> Settings
          </Link>
          <button 
            onClick={() => {
              setIsOpen(false);
              supabase.auth.signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  useEffect(() => {
    if (session?.user?.id) {
      migrateLocalToCloud(session.user.id);
    }
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-base"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" />;
  return children;
};

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => clsx(
        "flex items-center gap-2 transition-colors px-3 py-2 rounded-md",
        isActive ? "text-accent bg-accent/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      )}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

function Navigation() {
  const { profile } = useAuth();
  
  return (
    <nav className="flex gap-2 overflow-x-auto no-scrollbar items-center">
      <NavItem to="/" icon={Home} label="Home" />
      <NavItem to="/my-anime" icon={Library} label="My Anime" />
      <NavItem to="/search" icon={Search} label="Search" />
      {profile?.show_stats_in_navbar !== false && (
        <NavItem to="/statistics" icon={BarChart3} label="Statistics" />
      )}
      <NavItem to="/surprise-me" icon={Dices} label="Surprise Me" />
      {profile?.role === 'admin' && (
        <NavItem to="/admin" icon={ShieldAlert} label="Admin" />
      )}
      <Notifications />
      <HeaderProfile />
    </nav>
  );
}

function App() {

  useEffect(() => {
    async function fixDb() {
      try {
        const m = await db.animeMetadata.get(21);
        if (m && m.episodes === 1 && (m.status === "Unknown" || m.title === "ONE PIECE")) {
          await db.animeMetadata.update(21, { episodes: null });
        }
        
        const franchises = await db.franchises.toArray();
        for (const f of franchises) {
          let updated = false;
          f.seasons = f.seasons.map(s => {
            if (s.canonEpisodes === 1 && s.title === "ONE PIECE") {
              updated = true;
              return { ...s, canonEpisodes: 1168, episodes: null };
            }
            return s;
          });
          if (updated) {
            await db.franchises.put(f);
          }
        }
      } catch (e) { console.error(e); }
    }
    fixDb();
  }, []);

  return (
    <AuthProvider>
      <LoginModalProvider>
    <Router>
      <div className="min-h-screen flex flex-col">
        <header className="bg-dark-surface border-b border-zinc-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
              MY AN!ME
            </Link>
            <Navigation />
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/my-anime" element={<ProtectedRoute><MyAnimePage /></ProtectedRoute>} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
            <Route path="/surprise-me" element={<SurpriseMePage />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/anime/:id" element={<AnimeDetailsPage />} />
            <Route path="/franchise/:id" element={<FranchiseDetailsPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanelPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
            <LoginModal />
    </Router>
      </LoginModalProvider>
    </AuthProvider>
  );
}

export default App;
