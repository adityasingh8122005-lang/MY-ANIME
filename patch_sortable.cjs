const fs = require('fs');
let code = fs.readFileSync('src/components/SortableAnimeItem.jsx', 'utf8');

code = code.replace(/bg-dark-surface/g, 'bg-surface-2');
code = code.replace(/bg-dark-base\/90/g, 'bg-void/90');
code = code.replace(/bg-accent/g, 'bg-primary');
code = code.replace(/text-accent/g, 'text-primary');
code = code.replace(/border-accent/g, 'border-primary');
code = code.replace(/border-zinc-800/g, 'border-white/5');
code = code.replace(/border-zinc-700/g, 'border-white/10');

fs.writeFileSync('src/components/SortableAnimeItem.jsx', code);
