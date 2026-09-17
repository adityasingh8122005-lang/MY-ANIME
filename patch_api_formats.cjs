const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

const oldFormats = "['TV', 'MOVIE']";
const newFormats = "['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT']";

code = code.split(oldFormats).join(newFormats);

fs.writeFileSync('api/franchise.js', code);
