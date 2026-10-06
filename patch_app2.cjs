const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Insert ProtectedRoute above AppContent
const pr = `
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

function AppContent() {`;

code = code.replace('function AppContent() {', pr);
fs.writeFileSync('src/App.jsx', code);
