const fs = require('fs');
let code = fs.readFileSync('src/pages/SurpriseMePage.jsx', 'utf8');

const importRegex = /import \{ Dices, Loader2, Star, PlayCircle \} from 'lucide-react';/;
const newImports = `import { Dices, Loader2, Star, PlayCircle } from 'lucide-react';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';`;
if(!code.includes("AnimatedAnimeBackground")) code = code.replace(importRegex, newImports);

// Update SURPRISE_ME_QUERY to include bannerImage
code = code.replace("coverImage { large }", "coverImage { large }\n      bannerImage");

const returnRegex = /return \(\n\s*<div className="max-w-4xl mx-auto pb-12">/;
const newReturn = `return (
    <div className="max-w-4xl mx-auto pb-12 relative isolate min-h-[500px]">
      <AnimatedAnimeBackground anime={recommendations} />
      <div className="relative z-10 px-4">`;
if(!code.includes("<AnimatedAnimeBackground anime={recommendations} />")) code = code.replace(returnRegex, newReturn);

const endRegex = /<\/div>\n\s*\);\n\}/;
const newEnd = `      </div>\n    </div>\n  );\n}`;
if(!code.includes("</div>\n    </div>\n  );\n}")) code = code.replace(endRegex, newEnd);

fs.writeFileSync('src/pages/SurpriseMePage.jsx', code);
