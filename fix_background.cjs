const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace("backgroundImage: \\`url(\\${img})\\`,", "backgroundImage: `url(${img})`,");

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
