const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

const regex = /let movieCanonStatus = undefined;/;
const replacement = `let sourceOngoing = false;
        if (currentMedia.relations && currentMedia.relations.edges) {
          const sourceEdge = currentMedia.relations.edges.find(e => e.relationType === 'ADAPTATION' || e.relationType === 'SOURCE');
          if (sourceEdge && sourceEdge.node && (sourceEdge.node.status === 'RELEASING' || sourceEdge.node.status === 'HIATUS' || sourceEdge.node.status === 'NOT_YET_RELEASED')) {
            sourceOngoing = true;
          }
        }
        
        let movieCanonStatus = undefined;`;

code = code.replace(regex, replacement);

code = code.replace(
  "startDate: currentMedia.startDate",
  "startDate: currentMedia.startDate,\n          sourceOngoing"
);

fs.writeFileSync('api/franchise.js', code);
