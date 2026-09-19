const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

code = code.replace(
  "shadow-[0_0_20px_rgba(var(--color-accent),0.4)] backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--color-accent),0.6)]",
  "shadow-lg shadow-accent/50 backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/70"
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
