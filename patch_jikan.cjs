const fs = require('fs');
let code = fs.readFileSync('src/services/jikanApi.js', 'utf8');

code = code.replace(
  'const totalEps = details.episodes || 12; // Fallback to 12 if unknown',
  `// Fix the franchise bug where episodes was cached as 1
  const safeEps = (details.episodes === 1 && details.status === "Unknown") ? null : details.episodes;
  const totalEps = safeEps || 12; // Fallback to 12 if unknown`
);

fs.writeFileSync('src/services/jikanApi.js', code);
