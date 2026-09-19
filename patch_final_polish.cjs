const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

// Restore to user's requested cinematic values
code = code.replace("opacity: isCurrent ? 1 : 0,", "opacity: isCurrent ? 0.20 : 0,");
code = code.replace("filter: 'blur(4px)'", "filter: 'blur(24px)'");

// Ensure minimal overlays so the 20% opacity actually shines through the dark mode
const overlaysRegex = /\{\/\* Minimal Overlays to ensure visibility while testing \*\/\}.*?<\/div>/s;
const newOverlays = `{/* Overlays to ensure readability and maintain premium atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/30 via-transparent to-dark-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-base via-transparent to-dark-base opacity-70" />
      <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
    </div>`;

code = code.replace(overlaysRegex, newOverlays);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
