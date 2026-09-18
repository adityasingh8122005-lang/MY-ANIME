const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

code = code.replace(
  '<div className="max-w-7xl mx-auto relative overflow-hidden rounded-xl border border-transparent min-h-[500px] isolate">',
  '<div className="max-w-7xl mx-auto relative overflow-hidden isolate">'
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
