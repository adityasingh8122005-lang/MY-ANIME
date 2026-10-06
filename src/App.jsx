import { useNavigate } from "react-router-dom";
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





import Navbar from './components/layout/Navbar.jsx';


const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  useEffect(() => {
    if (session?.user?.id) {
      migrateLocalToCloud(session.user.id);
    }
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-void"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" />;
  return children;
};


function GlobalShortcutHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  return null;
}

function AppContent() {
  const { adminMode } = useAuth();

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

  if (adminMode) {
    return <AdminPanelPage />;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col pb-16 sm:pb-0 pt-14 sm:pt-0">
        <GlobalShortcutHandler />
          <Navbar />

        <main className="flex-1 content-container py-8 sm:mt-16">
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
          </Routes>
        </main>
      </div>
      <LoginModal />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <LoginModalProvider>
        <AppContent />
      </LoginModalProvider>
    </AuthProvider>
  );
}

export default App;

