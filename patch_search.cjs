const fs = require('fs');
let code = fs.readFileSync('src/pages/SearchPage.jsx', 'utf8');

const importRegex = /import \{ Search as SearchIcon, Loader2 \} from 'lucide-react';/;
const newImports = `import { Search as SearchIcon, Loader2 } from 'lucide-react';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';`;
if(!code.includes("AnimatedAnimeBackground")) code = code.replace(importRegex, newImports);

// Also update SEARCH_QUERY to include bannerImage
code = code.replace("coverImage { large }", "coverImage { large }\n      bannerImage");

const returnRegex = /return \(\n\s*<div className="max-w-7xl mx-auto">/;
const newReturn = `return (
    <div className="max-w-7xl mx-auto relative isolate min-h-[500px]">
      <AnimatedAnimeBackground anime={results} />
      <div className="relative z-10 px-4">`;
if(!code.includes("<AnimatedAnimeBackground anime={results} />")) code = code.replace(returnRegex, newReturn);

const endRegex = /<\/div>\n\s*\);\n\}/;
const newEnd = `      </div>\n    </div>\n  );\n}`;
if(!code.includes("</div>\n    </div>\n  );\n}")) code = code.replace(endRegex, newEnd);

fs.writeFileSync('src/pages/SearchPage.jsx', code);
