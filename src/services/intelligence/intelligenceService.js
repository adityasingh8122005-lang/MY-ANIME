import { getGroupedCollection } from '../franchiseService';
import { supabase } from '../supabase';

export async function getIntelligenceData() {
  const collection = await getGroupedCollection(true);
  const { data: watchHistory } = await supabase
    .from('watch_history')
    .select('*')
    .order('created_at', { ascending: false });

  // 1. Core Collection Stats
  const statuses = { 'Watching': 0, 'Plan to Watch': 0, 'Completed': 0, 'On Hold': 0, 'Dropped': 0 };
  let totalEpisodes = 0;
  let totalMinutes = 0;
  let hasKnownDuration = false;
  let ratedCount = 0;
  let ratingSum = 0;

  // For Universe & DNA
  const nodes = [];
  const genreCounts = {};
  const genreRatings = {};
  
  collection.forEach(g => {
    // If it's a franchise, iterate its parts
    const items = g.isFranchise ? g.seasons : [g];
    
    items.forEach(a => {
      // Status
      if (a.personalStatus && statuses[a.personalStatus] !== undefined) {
        statuses[a.personalStatus]++;
      }
      
      const watched = a.episodesWatched || 0;
      totalEpisodes += watched;
      
      // Rating
      if (a.personalRating > 0) {
        ratedCount++;
        ratingSum += a.personalRating;
      }

      // Duration
      if (watched > 0 && a.metadata?.duration) {
        const minMatch = a.metadata.duration.match(/(\d+)\s*min/);
        const hrMatch = a.metadata.duration.match(/(\d+)\s*hr/);
        let mins = 0;
        if (hrMatch) mins += parseInt(hrMatch[1], 10) * 60;
        if (minMatch) mins += parseInt(minMatch[1], 10);
        if (mins > 0) {
          totalMinutes += (watched * mins);
          hasKnownDuration = true;
        }
      }

      // Genres
      const genres = a.metadata?.genres?.map(g => g.name) || [];
      genres.forEach(genre => {
        if (!genreCounts[genre]) {
          genreCounts[genre] = { count: 0, ratingSum: 0, ratedCount: 0 };
        }
        genreCounts[genre].count++;
        if (a.personalRating > 0) {
          genreCounts[genre].ratingSum += a.personalRating;
          genreCounts[genre].ratedCount++;
        }
      });

      // Nodes for Universe
      nodes.push({
        id: a.malId,
        title: a.title,
        poster: a.poster || a.metadata?.images?.jpg?.image_url,
        status: a.personalStatus,
        rating: a.personalRating || 0,
        genres: genres,
        episodesWatched: watched
      });
    });
  });

  const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : 0;
  const watchHours = hasKnownDuration ? (totalMinutes / 60).toFixed(1) : 0;

  // 2. DNA Calculation
  // DNA formula: We weight genres by (Frequency * Average User Rating if available)
  const dnaScores = Object.entries(genreCounts).map(([genre, data]) => {
    const avgGenreRating = data.ratedCount > 0 ? (data.ratingSum / data.ratedCount) : (avgRating > 0 ? avgRating : 5);
    // Score = count * (rating / 5) -> rewards highly rated genres slightly more
    const score = data.count * (avgGenreRating / 5);
    return { genre, count: data.count, score, avgRating: avgGenreRating };
  }).sort((a, b) => b.score - a.score);

  const topGenres = dnaScores.slice(0, 8); // Max 8 axes for DNA radar
  const maxScore = topGenres.length > 0 ? topGenres[0].score : 1;
  const dna = topGenres.map(g => ({
    ...g,
    percentage: Math.min(100, Math.round((g.score / maxScore) * 100))
  }));

  // Insights Generation
  const insights = [];
  if (dna.length > 0) {
    insights.push(`You watch more ${dna[0].genre} than any other genre.`);
    // Highest rated genre (min 3 entries to qualify)
    const ratedGenres = dnaScores.filter(g => g.count >= 3).sort((a, b) => b.avgRating - a.avgRating);
    if (ratedGenres.length > 0 && ratedGenres[0].avgRating > 7) {
       insights.push(`Your highest-rated genre is ${ratedGenres[0].genre} (${ratedGenres[0].avgRating.toFixed(1)}/10).`);
    }
  }
  const totalAnime = Object.values(statuses).reduce((a, b) => a + b, 0);
  if (totalAnime > 0) {
    const completionRate = Math.round((statuses['Completed'] / totalAnime) * 100);
    insights.push(`You have completed ${completionRate}% of your collection.`);
  }

  // Watch History Chart (Last 14 days)
  const historyByDate = {};
  (watchHistory || []).forEach(h => {
    if (!historyByDate[h.date]) historyByDate[h.date] = 0;
    historyByDate[h.date] += h.episodesWatched;
  });
  const sortedDates = Object.keys(historyByDate).sort();
  const recentDates = sortedDates.slice(-14);
  const chartData = recentDates.map(date => ({ date, episodes: historyByDate[date] }));
  const maxChartEps = chartData.length > 0 ? Math.max(...chartData.map(d => d.episodes)) : 0;

  return {
    totalAnime,
    totalEpisodes,
    watchHours,
    hasKnownDuration,
    avgRating,
    statuses,
    dna,
    insights,
    chartData,
    maxChartEps,
    nodes, // For Anime Universe
    watchHistoryCount: watchHistory ? watchHistory.length : 0
  };
}
