const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace(
  '<div className="absolute inset-0 bg-gradient-to-b from-dark-base/40 via-transparent to-dark-base" />',
  '<div className="absolute inset-0 bg-gradient-to-b from-dark-base/60 via-transparent to-dark-base/80" />'
);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
