import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Search, Home, Library, Settings as SettingsIcon, BarChart3, Dices } from 'lucide-react';
import SearchPage from './pages/SearchPage.jsx';
import AnimeDetailsPage from './pages/AnimeDetailsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MyAnimePage from './pages/MyAnimePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import SurpriseMePage from './pages/SurpriseMePage.jsx';
import clsx from 'clsx';

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

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <header className="bg-dark-surface border-b border-zinc-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
              MY AN!ME
            </Link>
            <nav className="flex gap-2 overflow-x-auto no-scrollbar">
              <NavItem to="/" icon={Home} label="Home" />
              <NavItem to="/my-anime" icon={Library} label="My Anime" />
              <NavItem to="/search" icon={Search} label="Search" />
              <NavItem to="/statistics" icon={BarChart3} label="Statistics" />
              <NavItem to="/surprise-me" icon={Dices} label="Surprise Me" />
              <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-anime" element={<MyAnimePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/surprise-me" element={<SurpriseMePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/anime/:id" element={<AnimeDetailsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
