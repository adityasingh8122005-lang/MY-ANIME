const fs = require('fs');

function addImport(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("import AnimatedAnimeBackground")) {
     // inject right after the first line
     code = code.replace(/^import .*?;/m, "$&\nimport AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';");
     fs.writeFileSync(file, code);
     console.log('Fixed imports in', file);
  }
}

addImport('src/pages/SearchPage.jsx');
addImport('src/pages/SurpriseMePage.jsx');

// Increase opacity to 60%
let bg = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');
bg = bg.replace("opacity: isCurrent ? 0.35 : 0,", "opacity: isCurrent ? 0.60 : 0,");
fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', bg);
