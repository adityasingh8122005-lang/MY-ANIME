const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Inject the global keyboard listener
const importsEnd = code.indexOf('import { Toaster } from "react-hot-toast";');
if (importsEnd !== -1) {
    code = code.substring(0, importsEnd) + 'import { useNavigate } from "react-router-dom";\n' + code.substring(importsEnd);
}

// Create a small wrapper component to handle navigation since App might not have router context if it wraps Router, but App.jsx uses <BrowserRouter>.
// Actually, App uses <Router> inside it, so we can't use useNavigate in App directly. We need to create a GlobalShortcutHandler component inside the Router.
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

code = code.replace("export default function App() {", globalHandler + "\nexport default function App() {");
code = code.replace("<Navbar />", "<GlobalShortcutHandler />\n          <Navbar />");

fs.writeFileSync('src/App.jsx', code);
