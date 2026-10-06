const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const globalHandler = `
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
`;

code = code.replace("function AppContent() {", globalHandler + "\nfunction AppContent() {");

fs.writeFileSync('src/App.jsx', code);
