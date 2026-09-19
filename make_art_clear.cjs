const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

// Reduce blur significantly so the art can be seen clearly
code = code.replace("filter: 'blur(24px)'", "filter: 'blur(4px)'");

// Remove the aggressive horizontal darkening so the edges are visible
const overlaysRegex = /\{\/\* Overlays to ensure readability and maintain premium atmosphere \*\/\}.*?<\/div>/s;
const newOverlays = `{/* Light overlays so the art remains completely clear */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/20 via-transparent to-dark-base" />
      <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
    </div>`;

code = code.replace(overlaysRegex, newOverlays);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
