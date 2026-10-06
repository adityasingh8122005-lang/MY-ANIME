const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove old components defined inside App.jsx
code = code.replace(/const HeaderProfile = \(\) => \{[\s\S]*?export default App;/m, `
import Navbar from './components/layout/Navbar.jsx';

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
`);

fs.writeFileSync('src/App.jsx', code);
