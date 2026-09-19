const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

// The reason it zoomed in was because height was calc(100% + 4rem), which grew to 3000px+ 
// based on the grid content. 
// Changing it to 100vh locks it to the screen size, preventing aggressive bg-cover zooming.
code = code.replace(
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', height: 'calc(100% + 4rem)' }}",
  "style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', height: '100vh' }}"
);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
