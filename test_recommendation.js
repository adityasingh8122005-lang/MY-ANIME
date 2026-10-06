import { generateRecommendation } from './src/services/recommendation/recommendationService.js';
import { getIntelligenceData } from './src/services/intelligence/intelligenceService.js';
// To test this we need mock dependencies, since it uses fetch, we can just run it using Node with a mocked getIntelligenceData

const mockIntelligence = {
   totalAnime: 10,
   nodes: [{id: 21}, {id: 300}],
   dna: [
     {genre: 'Action', percentage: 100, avgRating: 9, score: 20, count: 5},
     {genre: 'Comedy', percentage: 50, avgRating: 4, score: 10, count: 2},
   ]
};

// Since we are running in node and intelligenceService uses franchiseService and supabase, we should actually run it inside a synthetic test or just trust the logic visually.
