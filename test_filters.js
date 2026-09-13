import 'fake-indexeddb/auto';
import { db } from './src/services/db.js';

async function runFilterLogic(collection, filters) {
  let eligible = collection;

  // 1. Status Filter
  if (filters.statusFilter !== 'Any') {
    eligible = eligible.filter(a => a.personalStatus === filters.statusFilter);
  }

  // 2. Max Episodes Filter
  if (filters.maxEpisodes !== '') {
    const limit = parseInt(filters.maxEpisodes, 10);
    if (!isNaN(limit)) {
      eligible = eligible.filter(a => {
        if (!a.metadata || !a.metadata.episodes) return false;
        return a.metadata.episodes <= limit;
      });
    }
  }

  // 3. Min MAL Rating
  if (filters.minMal !== 'Any') {
    const min = parseFloat(filters.minMal);
    eligible = eligible.filter(a => a.metadata?.score && a.metadata.score >= min);
  }

  // 4. Min My Rating
  if (filters.minMyRating !== 'Any') {
    const min = parseInt(filters.minMyRating, 10);
    eligible = eligible.filter(a => a.personalRating && a.personalRating >= min);
  }

  // 5. Genre Filter
  if (filters.genreFilter !== 'Any') {
    eligible = eligible.filter(a => a.metadata?.genres?.includes(filters.genreFilter));
  }

  // 6. Progress Filter
  if (filters.progressFilter !== 'Any') {
    eligible = eligible.filter(a => {
      const epsWatched = a.episodesWatched || 0;
      const total = a.metadata?.episodes;
      
      if (filters.progressFilter === 'Not Started') return epsWatched === 0;
      if (!total) return false;
      
      const pct = (epsWatched / total) * 100;
      
      if (filters.progressFilter === '1-25%') return pct > 0 && pct <= 25;
      if (filters.progressFilter === '25-75%') return pct > 25 && pct <= 75;
      if (filters.progressFilter === '75%+ (Not Finished)') return pct > 75 && pct < 100;
      
      const isOngoing = a.metadata?.status === 'Currently Airing';
      const isFinished = a.metadata?.status === 'Finished Airing';

      if (filters.progressFilter === 'Caught Up') return pct === 100 && isOngoing;
      if (filters.progressFilter === 'Completed') return pct === 100 && isFinished;
      
      return false;
    });
  }

  return eligible;
}

async function runTest() {
  const collection = [
    {
      malId: 1, // Anime A
      personalStatus: 'Plan to Watch',
      episodesWatched: 0,
      metadata: { episodes: 12, score: 8.0, genres: ['Action'], status: 'Finished Airing' }
    },
    {
      malId: 2, // Anime B
      personalStatus: 'Plan to Watch',
      episodesWatched: 6,
      metadata: { episodes: 24, score: 8.5, genres: ['Action'], status: 'Finished Airing' }
    },
    {
      malId: 3, // Anime C
      personalStatus: 'Plan to Watch',
      episodesWatched: 15,
      metadata: { episodes: 20, score: 9.0, genres: ['Drama'], status: 'Finished Airing' }
    },
    {
      malId: 4, // Anime D
      personalStatus: 'Completed',
      episodesWatched: 10,
      metadata: { episodes: 10, score: 8.2, genres: ['Action'], status: 'Finished Airing' } 
    },
    {
      malId: 5, // Anime E
      personalStatus: 'Watching',
      episodesWatched: 10,
      metadata: { episodes: 10, score: 8.2, genres: ['Action'], status: 'Currently Airing' } 
    }
  ];

  // Helper function to test single progress filters
  const testProgress = async (filterValue, expectedId) => {
    let res = await runFilterLogic(collection, {
      statusFilter: 'Any', maxEpisodes: '', minMal: 'Any', minMyRating: 'Any', genreFilter: 'Any',
      progressFilter: filterValue
    });
    return res.length === 1 && res[0].malId === expectedId;
  };

  console.log("Anime A (Not Started):", await testProgress('Not Started', 1) ? "✅" : "❌");
  console.log("Anime B (1-25%):", await testProgress('1-25%', 2) ? "✅" : "❌");
  console.log("Anime C (25-75%):", await testProgress('25-75%', 3) ? "✅" : "❌");
  console.log("Anime D (Completed):", await testProgress('Completed', 4) ? "✅" : "❌");
  console.log("Anime E (Caught Up):", await testProgress('Caught Up', 5) ? "✅" : "❌");

  // Min MAL >= 8.0 includes all A, B, C, D, E
  let resMal = await runFilterLogic(collection, {
    statusFilter: 'Any', maxEpisodes: '', minMal: '8.0', minMyRating: 'Any', genreFilter: 'Any', progressFilter: 'Any'
  });
  console.log("Min MAL 8.0 includes all:", resMal.length === 5 ? "✅" : "❌");

  // Max Episodes 24 excludes C (25 eps) -> wait, Anime C has 20 eps in spec
  // Spec: Anime C: 20 episodes. Oh, wait, the prompt says "Maximum Episodes = 24 excludes any >24."
  // So let's test a hypothetical anime with 26 episodes.
  collection.push({
    malId: 6,
    personalStatus: 'Watching',
    episodesWatched: 0,
    metadata: { episodes: 26, score: 9.0 }
  });
  let resMaxEps = await runFilterLogic(collection, {
    statusFilter: 'Any', maxEpisodes: '24', minMal: 'Any', minMyRating: 'Any', genreFilter: 'Any', progressFilter: 'Any'
  });
  console.log("Max Episodes 24 excludes > 24:", resMaxEps.find(a => a.malId === 6) === undefined ? "✅" : "❌");
}

runTest();
