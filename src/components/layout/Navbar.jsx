import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Library, Search, BarChart3, UserCircle, LogOut, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLoginModal } from '../../contexts/LoginModalContext.jsx';
import Notifications from '../Notifications.jsx';
import { supabase } from '../../services/supabase.js';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => clsx(
        "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-xl transition-normal group min-w-[64px] sm:min-w-0 flex-1 sm:flex-none",
        isActive 
          ? "text-primary sm:bg-primary/10" 
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={clsx("transition-transform duration-300", isActive && "scale-110")} />
          <span className={clsx(
            "text-micro sm:text-body-s font-medium transition-colors",
            isActive ? "text-primary" : ""
          )}>
            {label}
          </span>
          {/* Active indicator dot on desktop */}
          {isActive && (
            <span className="hidden sm:block absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-t-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

const HeaderProfile = () => {
  const { session, profile, isAdmin, adminMode, toggleAdminMode } = useAuth();
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
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
  
  if (!session) {
    return (
      <button onClick={openLoginModal} className="p-2 sm:p-1 text-zinc-400 hover:text-white transition-colors focus-visible-ring rounded-full" title="Account">
        <UserCircle size={24} />
      </button>
    );
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
        className="p-1 shrink-0 rounded-full border border-zinc-700 hover:border-zinc-400 transition-colors overflow-hidden w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-surface-2 focus-visible-ring"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <UserCircle size={24} className="text-zinc-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-12 sm:bottom-auto sm:mt-2 w-48 glass-panel rounded-xl shadow-depth-3 py-1 z-50">
          <Link 
            to={profile?.username ? `/profile/${profile.username}` : '/settings'}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 sm:py-2 text-body-s text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <UserCircle size={16} /> Profile
          </Link>
          <Link 
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 sm:py-2 text-body-s text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <SettingsIcon size={16} /> Settings
          </Link>
          {isAdmin && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                toggleAdminMode();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 sm:py-2 text-body-s text-warning hover:bg-white/10 transition-colors"
            >
              <ShieldAlert size={16} /> {adminMode ? 'Exit Admin Mode' : 'Switch to Admin'}
            </button>
          )}

          <button 
            onClick={() => {
              setIsOpen(false);
              supabase.auth.signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-2 text-body-s text-error hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { profile } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className={clsx(
        "hidden sm:block fixed top-0 inset-x-0 z-50 transition-cinematic duration-500",
        scrolled 
          ? "bg-surface-1/85 backdrop-blur-xl border-b border-white/5 shadow-depth-2" 
          : "bg-gradient-to-b from-void/90 to-transparent border-b border-transparent shadow-none"
      )}>
        <div className="content-container h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-wider text-primary focus-visible-ring rounded-md font-mono shrink-0">
            MY AN!ME
          </Link>
          
          <div className="flex-1 flex items-center justify-end">
            <nav className="flex items-center gap-1 mr-4">
              <NavItem to="/" icon={Home} label="Home" />
              <NavItem to="/my-anime" icon={Library} label="Collection" />
              <NavItem to="/search" icon={Search} label="Search" />
              {profile?.show_stats_in_navbar !== false && (
                <NavItem to="/statistics" icon={BarChart3} label="Stats" />
              )}
            </nav>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <Notifications />
              <HeaderProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header (Just Logo + Notifications + Profile) */}
      <header className={clsx(
        "sm:hidden fixed top-0 inset-x-0 z-50 transition-cinematic duration-500",
        scrolled 
          ? "bg-surface-1/85 backdrop-blur-xl border-b border-white/5 shadow-depth-2" 
          : "bg-gradient-to-b from-void/90 to-transparent border-b border-transparent shadow-none"
      )}>
        <div className="px-5 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-wider text-primary font-mono shrink-0 focus-visible-ring rounded-md">
            MY AN!ME
          </Link>
          <div className="flex items-center gap-3">
            <Notifications />
            <HeaderProfile />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 glass-panel border-t border-white/5 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/my-anime" icon={Library} label="Collection" />
          <NavItem to="/search" icon={Search} label="Search" />
          {profile?.show_stats_in_navbar !== false && (
            <NavItem to="/statistics" icon={BarChart3} label="Stats" />
          )}
        </div>
      </nav>
    </>
  );
}
