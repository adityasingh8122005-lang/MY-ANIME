const fs = require('fs');

let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// The anime badge (ONGOING/COMPLETED)
code = code.replace(
  '<div className="absolute top-2 left-2 bg-dark-base/90 backdrop-blur-sm px-2 py-1 rounded text-micro font-bold text-white border border-zinc-700">',
  '<div className="absolute top-2 left-2 bg-void/90 backdrop-blur-sm px-2 py-1 rounded text-micro font-bold text-white border border-zinc-700" style={{ transform: "translateZ(30px)" }}>'
);

// The anime title
code = code.replace(
  '<h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-accent transition-colors" title={anime.title.english || anime.title.romaji}>',
  '<h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors" title={anime.title.english || anime.title.romaji} style={{ transform: "translateZ(40px)" }}>'
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
