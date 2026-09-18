const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');
code = code.replace("coverImage { large }", "coverImage { large }\n      bannerImage");
fs.writeFileSync('src/pages/HomePage.jsx', code);
