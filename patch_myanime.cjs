const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

const importRegex = /import SortableAnimeItem from '\.\.\/components\/SortableAnimeItem';/;
const newImports = `import SortableAnimeItem from '../components/SortableAnimeItem';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';`;
if(!code.includes("AnimatedAnimeBackground")) code = code.replace(importRegex, newImports);

const returnRegex = /return \(\n\s*<div className="max-w-7xl mx-auto pb-12">/;
const newReturn = `return (
    <div className="max-w-7xl mx-auto pb-12 relative isolate">
      <AnimatedAnimeBackground anime={collection} />
      <div className="relative z-10 px-4">`;

if(!code.includes("<AnimatedAnimeBackground anime={collection} />")) code = code.replace(returnRegex, newReturn);

const endRegex = /<\/div>\n\s*\);\n\}/;
const newEnd = `      </div>\n    </div>\n  );\n}`;
if(!code.includes("</div>\n    </div>\n  );\n}")) code = code.replace(endRegex, newEnd);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);
