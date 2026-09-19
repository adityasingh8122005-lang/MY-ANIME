const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace("opacity: isCurrent ? 0.35 : 0,", "opacity: isCurrent ? 0.8 : 0,");
code = code.replace("filter: 'blur(16px)'", "filter: 'blur(4px)'");

// Remove extreme darkening overlays
const overlaysRegex = /\{\/\* Overlays to ensure readability and maintain premium atmosphere \*\/\}.*?<\/div>/s;
const newOverlays = `{/* Minimal Overlays to ensure visibility while testing */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/40 via-transparent to-dark-base" />
      <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
    </div>`;

code = code.replace(overlaysRegex, newOverlays);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
