const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');
code = code.replace("opacity: isCurrent ? 0.85 : 0,", "opacity: isCurrent ? 1 : 0,");
fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
