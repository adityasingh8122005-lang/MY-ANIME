const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const importsToAdd = `
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { Navigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from './services/supabase.js';
`;

code = code.replace("import { LogOut } from 'lucide-react';", "");
code = code.replace("import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';", "import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';" + importsToAdd);

const protectedRouteCode = `
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-base"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" />;
  return children;
};
`;

code = code.replace("function NavItem", protectedRouteCode + "\nfunction NavItem");

// Wrap the main return in AuthProvider
code = code.replace("<Router>", "<AuthProvider>\n    <Router>");
code = code.replace("</Router>", "</Router>\n    </AuthProvider>");

// Wrap Routes in ProtectedRoute (except /auth)
const originalRoutes = `<Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/my-anime" element={<MyAnimePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/surprise-me" element={<SurpriseMePage />} />
                <Route path="/anime/:id" element={<AnimeDetailsPage />} />
                <Route path="/franchise/:id" element={<FranchiseDetailsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>`;

const newRoutes = `<Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/my-anime" element={<ProtectedRoute><MyAnimePage /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
                <Route path="/surprise-me" element={<ProtectedRoute><SurpriseMePage /></ProtectedRoute>} />
                <Route path="/anime/:id" element={<ProtectedRoute><AnimeDetailsPage /></ProtectedRoute>} />
                <Route path="/franchise/:id" element={<ProtectedRoute><FranchiseDetailsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              </Routes>`;

code = code.replace(originalRoutes, newRoutes);

// Add a sign out button next to Notifications
code = code.replace(
  "<Notifications />",
  `<Notifications />
              <button onClick={() => supabase.auth.signOut()} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" title="Sign Out">
                <LogOut size={20} />
              </button>`
);

fs.writeFileSync('src/App.jsx', code);
