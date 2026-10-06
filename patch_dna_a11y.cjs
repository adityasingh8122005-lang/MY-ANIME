const fs = require('fs');
let code = fs.readFileSync('src/components/intelligence/AnimeDNA.jsx', 'utf8');

code = code.replace(
  `<svg width={size} height={size} className="overflow-visible">`,
  `<svg width={size} height={size} className="overflow-visible" role="img" aria-label={\`Anime DNA Radar Chart showing preferences across \${dna.length} top genres\`}>`
);

fs.writeFileSync('src/components/intelligence/AnimeDNA.jsx', code);
