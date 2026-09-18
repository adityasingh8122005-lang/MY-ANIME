const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

const importRegex = /import MyAnimePage from '\.\/MyAnimePage';/;
const newImports = `import MyAnimePage from './MyAnimePage';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';`;

code = code.replace(importRegex, newImports);

const returnRegex = /return \(\n\s*<div className="max-w-7xl mx-auto">/;
const newReturn = `return (
    <div className="max-w-7xl mx-auto relative overflow-hidden rounded-xl border border-transparent min-h-[500px] isolate">
      <AnimatedAnimeBackground anime={trending} />
      <div className="relative z-10 px-4 pb-8">`;

code = code.replace(returnRegex, newReturn);

// Also we need to close the extra div at the end
const endRegex = /<\/div>\n\s*\);\n\}/;
const newEnd = `      </div>\n    </div>\n  );\n}`;

code = code.replace(endRegex, newEnd);

fs.writeFileSync('src/pages/HomePage.jsx', code);
