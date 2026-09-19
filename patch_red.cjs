const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace(
  "className=\"absolute z-0 pointer-events-none overflow-hidden\"",
  "className=\"absolute z-0 pointer-events-none overflow-hidden\" style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', bottom: '-2rem', backgroundColor: 'red' }}"
);
// wait I already have style prop on that div!
