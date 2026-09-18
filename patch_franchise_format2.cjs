const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

const regexFormatCheck = /\['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'\]\.includes\((currentMedia\.format|e\.node\.format)\)/g;

code = code.replace(regexFormatCheck, "(!$1 || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes($1))");

fs.writeFileSync('api/franchise.js', code);
