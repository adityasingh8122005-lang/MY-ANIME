const fs = require('fs');
let code = fs.readFileSync('src/services/recommendation/recommendationService.js', 'utf8');

const bad = `      // Genre Match Bonus based on DNA multipliers
      anime.genres.forEach(g => {
         const dnaMatch = intelligence.dna.find(d => d.genre === g);
         if (dnaMatch) {
            // affinity bonus: frequency multiplier mapped to a 0-20 point boost
            score += Math.min(20, (dnaMatch.percentage / 100) * 20); 
            // Rating affinity bonus
            if (dnaMatch.avgRating > 7) {
               score += 10;
            } else if (dnaMatch.avgRating < 5) {
               score -= 10; // Penalty for genres they rate poorly
            }
         } else if (mode === 'Different') {
            // In exploration mode, reward genres NOT in their DNA
            score += 15;
         }
      });`;

const good = `      // Genre Match Bonus based on DNA multipliers
      let totalBonus = 0;
      anime.genres.forEach(g => {
         const dnaMatch = intelligence.dna.find(d => d.genre === g);
         if (dnaMatch) {
            // affinity bonus: frequency multiplier mapped to a 0-20 point boost
            totalBonus += Math.min(20, (dnaMatch.percentage / 100) * 20); 
            // Rating affinity bonus
            if (dnaMatch.avgRating > 7) {
               totalBonus += 10;
            } else if (dnaMatch.avgRating < 5) {
               totalBonus -= 10; // Penalty for genres they rate poorly
            }
         } else if (mode === 'Different') {
            // In exploration mode, reward genres NOT in their DNA
            totalBonus += 15;
         }
      });
      // Normalize maximum bonus to prevent multi-genre inflation
      // Capped at +50 so Base Score (0-100) retains authority over quality, 
      // but personalization can still dramatically tilt the scales.
      score += Math.max(-20, Math.min(50, totalBonus));`;

code = code.replace(bad, good);
fs.writeFileSync('src/services/recommendation/recommendationService.js', code);
