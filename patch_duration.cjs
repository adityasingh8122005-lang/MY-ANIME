const fs = require('fs');
let code = fs.readFileSync('src/services/intelligence/intelligenceService.js', 'utf8');

const lines = code.split('\n');
const fixedLines = [];
let inBadBlock = false;

for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('// Genres')) {
     fixedLines.push('        } else {');
     fixedLines.push('          missingDurationCount += watched;');
     fixedLines.push('        }');
     fixedLines.push('      }');
     fixedLines.push('');
  }
  
  if (lines[i].includes('} else {') && lines[i+1]?.includes('missingDurationCount += watched;') && lines[i+2]?.includes('} else {')) {
     // skip the double inject if it's there at the bottom, wait no, I don't know what's there.
  }

}
