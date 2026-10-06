const fs = require('fs');
let code = fs.readFileSync('src/services/recommendation/recommendationService.js', 'utf8');

code = code.replace(
  `  // 5. Generate Data-Driven Reason if not already set
  if (!recommendationReason) {`,
  `  // 5. Generate Data-Driven Reason if not already set
  if (!recommendationReason) {
     if (intelligence.totalAnime > 0 && intelligence.totalAnime < 3) {
         recommendationReason = "I'm still learning your taste. Here is a highly-rated recommendation to help build your universe.";
     } else`
);

fs.writeFileSync('src/services/recommendation/recommendationService.js', code);
