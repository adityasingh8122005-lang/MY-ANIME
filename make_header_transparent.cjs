const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Change solid header to glassmorphism (transparent but blurred)
code = code.replace(
  'className="bg-dark-surface border-b border-zinc-800 sticky top-0 z-50"',
  'className="bg-dark-base/30 backdrop-blur-md border-b border-white/5 sticky top-0 z-50"'
);

fs.writeFileSync('src/App.jsx', code);
