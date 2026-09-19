const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace("a?.bannerImage || a?.coverImage?.large", "a?.bannerImage || a?.coverImage?.large || a?.poster");
code = code.replace("opacity: isCurrent ? 0.20 : 0,", "opacity: isCurrent ? 0.35 : 0,");

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
