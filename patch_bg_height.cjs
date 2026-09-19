const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace(
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', bottom: '-2rem' }}",
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', height: 'calc(100% + 4rem)' }}"
);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
