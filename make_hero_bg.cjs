const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

// Change opacity to 0.85 and remove blur entirely for a sharp, vivid hero background
code = code.replace("opacity: isCurrent ? 0.60 : 0,", "opacity: isCurrent ? 0.85 : 0,");
code = code.replace("filter: 'blur(4px)'", "/* no blur for sharp art */");

// Refine overlays:
// Remove the purple accent overlay to keep original art colors
// Make the top-to-bottom gradient slightly stronger at the very top for navbar readability, 
// transparent in the middle for art clarity, and solid at the bottom to blend into the page.
const overlaysRegex = /\{\/\* Light overlays so the art remains completely clear \*\/\}.*?<\/div>/s;
const newOverlays = `{/* Hero overlays: preserve true colors, blend bottom into page, darken top for navbar */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/60 via-dark-base/20 to-dark-base" />
    </div>`;

code = code.replace(overlaysRegex, newOverlays);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
