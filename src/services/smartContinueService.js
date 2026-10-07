import { getGroupedCollection } from './franchiseService';
import { getWatchHistory } from './userService';

/**
 * SMART CONTINUE RANKING FORMULA
 * 
 * ContinueScore = WatchingStatusWeight + ProgressWeight + PersonalRatingWeight + RecentActivityWeight + NearingCompletionBonus
 * 
 * Weights:
 * - Base "Watching" Status = 100 points (to ensure Watching items appear first)
 * - Progress (0-50 points) = (watched / total) * 50
 * - Personal Rating (0-30 points) = rating * 3
 * - Recent Activity Bonus = up to 50 points if watched recently (decay over 30 days)
 * - Nearing Completion Bonus = 20 points if >80% complete
 * 
 * Drops items that are "Completed", "Dropped", or "On Hold" unless explicitly overridden.
 */
export async function getSmartContinueQueue() {
  const collection = await getGroupedCollection(false);
  const history = await getWatchHistory();
  
  if (!collection || collection.length === 0) return [];
  
  // Find the latest timestamp for each anime from history
  const latestWatchDates = new Map();
  history.forEach(h => {
    const existing = latestWatchDates.get(h.malId);
    const hDate = new Date(h.date).getTime();
    if (!existing || hDate > existing) {
      latestWatchDates.set(h.malId, hDate);
    }
  });

  const queue = collection
    .filter(item => item.personalStatus === 'Watching')
    .map(item => {
      let score = 100; // Base watching score
      
      const totalEp = item.isFranchise ? item.totalCanon : item.canonEpisodes;
      const watched = item.isFranchise ? item.totalWatched : item.episodesWatched;
      
      const progressPercent = totalEp > 0 ? (watched / totalEp) : 0;
      score += (progressPercent * 50);
      
      if (progressPercent >= 0.8) score += 20; // Nearing completion
      
      if (item.personalRating) {
        score += (item.personalRating * 3);
      }
      
      const lastWatch = latestWatchDates.get(item.isFranchise ? item.franchiseId : item.malId) 
                        || new Date(item.updatedAt).getTime();
                        
      const daysSinceWatch = (Date.now() - lastWatch) / (1000 * 60 * 60 * 24);
      if (daysSinceWatch <= 30) {
        score += Math.max(0, 50 - (daysSinceWatch * (50/30))); // Linear decay over 30 days
      }
      
      return {
        ...item,
        continueScore: score,
        progressPercent: progressPercent * 100,
        lastWatchDate: lastWatch
      };
    })
    .sort((a, b) => b.continueScore - a.continueScore);

  return queue;
}
