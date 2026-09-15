const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "import SurpriseMePage from './pages/SurpriseMePage.jsx';",
  "import SurpriseMePage from './pages/SurpriseMePage.jsx';\nimport Notifications from './components/Notifications.jsx';"
);

code = code.replace(
  "</Link>",
  "</Link>\n            <Notifications />"
);

fs.writeFileSync('src/App.jsx', code);
