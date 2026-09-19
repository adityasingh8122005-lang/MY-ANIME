const fs = require('fs');
let code = fs.readFileSync('src/pages/SurpriseMePage.jsx', 'utf8');

code = code.replace("<AnimatedAnimeBackground anime={recommendations} />", "<AnimatedAnimeBackground anime={selectedAnime ? [selectedAnime] : []} />");

fs.writeFileSync('src/pages/SurpriseMePage.jsx', code);
