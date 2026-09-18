const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

// Use bannerImage if available, fallback to coverImage.large
code = code.replace(
  "const validImages = anime\n    .map(a => a?.coverImage?.large)",
  "const validImages = anime\n    .map(a => a?.bannerImage || a?.coverImage?.large)"
);

// Fix wrapper to span 100vw to break out of max-w-7xl
code = code.replace(
  '<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-dark-base">',
  `<div 
      className="absolute z-0 pointer-events-none overflow-hidden bg-dark-base"
      style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: 0, height: '100%' }}
    >`
);

// Adjust opacity and overlays to actually be visible
code = code.replace("opacity: isCurrent ? 0.15 : 0,", "opacity: isCurrent ? 0.35 : 0,");
code = code.replace("filter: 'blur(24px)'", "filter: 'blur(16px)'");

// Reduce excessive darkening overlays
const overlaysRegex = /\{\/\* Overlays to ensure readability and maintain premium atmosphere \*\/\}.*?<\/div>/s;
const newOverlays = `{/* Overlays to ensure readability and maintain premium atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base via-transparent to-dark-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-base via-transparent to-dark-base opacity-90" />
      <div className="absolute inset-0 bg-dark-base/50" />
      <div className="absolute inset-0 bg-accent/20 mix-blend-overlay" />
    </div>`;

code = code.replace(overlaysRegex, newOverlays);

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
