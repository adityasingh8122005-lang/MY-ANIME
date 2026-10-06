const fs = require('fs');

let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');
code = code.replace(/<AnimeCard3DWrapper>/g, '<AnimeCard3DWrapper key={anime.idMal}>');
fs.writeFileSync('src/pages/HomePage.jsx', code);

code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');
code = code.replace(/<AnimeCard3DWrapper>/g, '<AnimeCard3DWrapper key={anime.malId}>');
fs.writeFileSync('src/pages/ProfilePage.jsx', code);
