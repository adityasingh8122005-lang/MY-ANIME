// Synthetic test of intelligenceService Math logic
const mockCollection = [
  { personalStatus: 'Completed', episodesWatched: 12, personalRating: 0, metadata: { genres: [{name: 'Action'}], duration: '24 min per ep' } },
  { personalStatus: 'Completed', episodesWatched: 12, personalRating: 10, metadata: { genres: [{name: 'Action'}, {name: 'Sci-Fi'}], duration: '24 min per ep' } },
  { personalStatus: 'Watching', episodesWatched: 5, personalRating: 8, metadata: { genres: [{name: 'Comedy'}], duration: '24 min' } },
  { personalStatus: 'Plan to Watch', episodesWatched: 0, personalRating: 0, metadata: { genres: [{name: 'Action'}], duration: 'Unknown' } }
];

let statuses = { 'Watching': 0, 'Plan to Watch': 0, 'Completed': 0, 'On Hold': 0, 'Dropped': 0 };
let totalEpisodes = 0; let totalMinutes = 0; let hasKnownDuration = false; let missingDurationCount = 0;
let genreCounts = {}; let ratedCount = 0; let ratingSum = 0;

mockCollection.forEach(a => {
  statuses[a.personalStatus]++;
  totalEpisodes += a.episodesWatched;
  if(a.personalRating > 0) { ratedCount++; ratingSum += a.personalRating; }
  
  const watched = a.episodesWatched;
  if (watched > 0) {
      if (a.metadata?.duration) {
          const minMatch = a.metadata.duration.match(/(\d+)\s*min/);
          let mins = 0;
          if (minMatch) mins += parseInt(minMatch[1], 10);
          if (mins > 0) {
              totalMinutes += (watched * mins);
              hasKnownDuration = true;
          } else { missingDurationCount += watched; }
      } else { missingDurationCount += watched; }
  }
  
  a.metadata.genres.forEach(g => {
      const genre = g.name;
      if (!genreCounts[genre]) genreCounts[genre] = { count: 0, ratingSum: 0, ratedCount: 0 };
      genreCounts[genre].count++;
      if (a.personalRating > 0) { genreCounts[genre].ratingSum += a.personalRating; genreCounts[genre].ratedCount++; }
  });
});

console.log("--- MATH TEST ---");
console.log("Total Episodes:", totalEpisodes);
console.log("Total Minutes:", totalMinutes);
console.log("Watch Hours:", hasKnownDuration ? (totalMinutes / 60).toFixed(1) : 0);
console.log("Missing Duration Episodes:", missingDurationCount);
console.log("Watch Time Type:", missingDurationCount === 0 && hasKnownDuration ? 'Exact Estimate' : hasKnownDuration ? 'Partial Estimate' : 'Unavailable');

const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : 0;
const dnaScores = Object.entries(genreCounts).map(([genre, data]) => {
  const avgGenreRating = data.ratedCount > 0 ? (data.ratingSum / data.ratedCount) : null;
  const multiplier = avgGenreRating !== null ? (avgGenreRating / 5) : 1.0;
  const score = data.count * multiplier;
  return { genre, count: data.count, score, avgRating: avgGenreRating };
}).sort((a, b) => b.score - a.score);

console.log("DNA Data:", JSON.stringify(dnaScores, null, 2));
