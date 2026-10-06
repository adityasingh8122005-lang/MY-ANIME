import { getIntelligenceData } from '../intelligence/intelligenceService';

// Standard Anilist Genres for Exploration
const ALL_ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha',
  'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

async function fetchAnilistCandidates(genres, isDifferent = false) {
  const query = `
    query ($page: Int, $inGenres: [String], $notInGenres: [String]) {
      Page (page: $page, perPage: 50) {
        media (
          type: ANIME, 
          genre_in: $inGenres, 
          genre_not_in: $notInGenres,
          sort: [POPULARITY_DESC, SCORE_DESC],
          isAdult: false,
          format_in: [TV, MOVIE]
        ) {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large }
          bannerImage
          description
          genres
          averageScore
          episodes
          status
          format
        }
      }
    }
  `;

  // Randomize page slightly to avoid always getting identical top 1
  const page = Math.floor(Math.random() * 3) + 1; 

  const variables = {
    page: page,
    inGenres: genres.length > 0 ? genres : undefined,
    notInGenres: isDifferent && genres.length > 0 ? genres : undefined
  };

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
     throw new Error('Failed to fetch from Anilist');
  }

  const json = await res.json();
  return json.data.Page.media.filter(m => m.idMal); // Must have MAL ID to sync with Jikan ecosystem
}

export async function generateRecommendation(mode) {
  // 1. Fetch User Intelligence
  const intelligence = await getIntelligenceData();
  const collectionMalIds = new Set(intelligence.nodes.map(n => n.id));

  // Determine top genres
  const topGenres = intelligence.dna.slice(0, 3).map(d => d.genre);
  
  let candidates = [];
  let recommendationReason = "";
  let queryGenres = [];

  // 2. Fetch Candidates based on Mode
  if (intelligence.totalAnime === 0) {
     // Empty collection fallback -> Just pure popularity Surprise
     candidates = await fetchAnilistCandidates([]);
     recommendationReason = "A globally popular masterpiece to start your journey.";
  } else if (mode === 'Taste') {
     queryGenres = topGenres;
     candidates = await fetchAnilistCandidates(queryGenres);
  } else if (mode === 'Different') {
     // Find genres the user almost never watches
     const watchedGenres = intelligence.dna.map(d => d.genre);
     const unwatchedGenres = ALL_ANILIST_GENRES.filter(g => !watchedGenres.includes(g));
     if (unwatchedGenres.length > 0) {
         queryGenres = [unwatchedGenres[Math.floor(Math.random() * unwatchedGenres.length)]];
         candidates = await fetchAnilistCandidates(queryGenres, false);
     } else {
         // They watched everything? Exclude their top 3
         candidates = await fetchAnilistCandidates(undefined, topGenres);
     }
  } else {
     // Surprise Me -> Any genre
     candidates = await fetchAnilistCandidates([]);
  }

  // 3. Exclusion Rules
  // Filter out any anime already in the user's collection (Plan to Watch, Completed, etc.)
  const undiscovered = candidates.filter(c => !collectionMalIds.has(c.idMal));

  if (undiscovered.length === 0) {
      throw new Error("No undiscovered anime found for these criteria. Try a different mode!");
  }

  // 4. Scoring Algorithm (Deterministic based on user data)
  // Score = BaseScore + GenreAffinity + RatingAffinity
  const scoredCandidates = undiscovered.map(anime => {
      let score = anime.averageScore || 50; // base out of 100
      
      // Genre Match Bonus based on DNA multipliers
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
      });

      return { ...anime, finalScore: score };
  });

  // Sort by final score descending
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  
  // Pick the winner (add tiny randomness among top 3 to keep it fresh on repeats)
  const topPool = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
  const winner = topPool[Math.floor(Math.random() * topPool.length)];

  // 5. Generate Data-Driven Reason if not already set
  if (!recommendationReason) {
     if (intelligence.totalAnime > 0 && intelligence.totalAnime < 3) {
         recommendationReason = "I'm still learning your taste. Here is a highly-rated recommendation to help build your universe.";
     } else
     if (mode === 'Taste') {
         const matchedTop = winner.genres.find(g => topGenres.includes(g));
         if (matchedTop) {
            const matchData = intelligence.dna.find(d => d.genre === matchedTop);
            if (matchData && matchData.avgRating > 7) {
               recommendationReason = `You tend to rate ${matchedTop} highly (${matchData.avgRating.toFixed(1)}/10), and this is a must-watch.`;
            } else {
               recommendationReason = `This matches your strong preference for ${matchedTop}.`;
            }
         } else {
            recommendationReason = "This highly-rated anime strongly aligns with your general preferences.";
         }
     } else if (mode === 'Different') {
         const newGenre = winner.genres.find(g => !topGenres.includes(g)) || winner.genres[0];
         recommendationReason = `You rarely watch ${newGenre}. This is the perfect anime to expand your universe.`;
     } else {
         const matchedTop = winner.genres.find(g => topGenres.includes(g));
         if (matchedTop) {
            recommendationReason = `A wildcard pick that still features ${matchedTop}, one of your favorites.`;
         } else {
            recommendationReason = "A completely wild discovery outside your usual patterns.";
         }
     }
  }

  return {
     anime: winner,
     reason: recommendationReason
  };
}
