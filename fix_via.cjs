const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace(
  'from-dark-base/60 via-dark-base/20 to-dark-base',
  'from-dark-base/70 via-transparent to-dark-base'
);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
