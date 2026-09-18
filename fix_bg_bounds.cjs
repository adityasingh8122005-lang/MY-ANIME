const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace(
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: 0, height: '100%' }}",
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', bottom: '-2rem' }}"
);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
