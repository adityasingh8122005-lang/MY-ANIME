const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "import { supabase } from './services/supabase.js';",
  "import { supabase } from './services/supabase.js';\nimport { migrateLocalToCloud } from './services/cloudMigration.js';\nimport { useEffect } from 'react';"
);

const oldProtectedRoute = `const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-base"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" />;
  return children;
};`;

const newProtectedRoute = `const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  useEffect(() => {
    if (session?.user?.id) {
      migrateLocalToCloud(session.user.id);
    }
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-base"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" />;
  return children;
};`;

code = code.replace(oldProtectedRoute, newProtectedRoute);
fs.writeFileSync('src/App.jsx', code);
