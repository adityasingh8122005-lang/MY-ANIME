const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

const regexOngoing = /for \(const season of f\.seasons\) \{\n\s*if \(season\.status === 'RELEASING' \|\| season\.status === 'NOT_YET_RELEASED' \|\| season\.status === 'Currently Airing' \|\| season\.status === 'Releasing' \|\| season\.status === 'Not yet aired'\) \{\n\s*isOngoing = true;\n\s*break;\n\s*\}\n\s*\}/;

const replacementOngoing = `for (const season of f.seasons) {
          if (season.status === 'RELEASING' || season.status === 'NOT_YET_RELEASED' || season.status === 'Currently Airing' || season.status === 'Releasing' || season.status === 'Not yet aired') {
            isOngoing = true;
            break;
          }
          if (season.sourceOngoing === true) {
            isOngoing = true;
          }
        }`;

code = code.replace(regexOngoing, replacementOngoing);
fs.writeFileSync('src/services/franchiseService.js', code);
