const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

code = code.replace(
  "['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(currentMedia.format)",
  "(!currentMedia.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(currentMedia.format))"
);

code = code.replace(
  "['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format)",
  "(!e.node.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format))"
);
code = code.replace(
  "['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format)",
  "(!e.node.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format))"
); // There are two relations.edges.find

fs.writeFileSync('api/franchise.js', code);
