const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

const syncCode = `
export async function autoSyncStaleData() {
  const lastSync = localStorage.getItem('lastStaleDataSync');
  const now = Date.now();
  // Sync once every 24 hours
  if (lastSync && now - parseInt(lastSync) < 24 * 60 * 60 * 1000) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  console.log("Running daily stale data sync for statuses...");
  
  try {
    const { data: userAnimes } = await supabase.from('user_anime').select('mal_id').eq('user_id', session.user.id);
    if (!userAnimes || userAnimes.length === 0) return;
    
    // We will sync ALL metadata rows that belong to this user
    const malIds = userAnimes.map(u => u.mal_id);
    const { data: metadataList } = await supabase.from('anime_metadata').select('mal_id, status').in('mal_id', malIds);
    
    // Also sync all franchises' seasons
    const { data: franchises } = await supabase.from('franchises').select('franchise_id, seasons');
    
    const allMalIdsToFetch = new Set(metadataList?.map(m => m.mal_id) || []);
    if (franchises) {
      for (const f of franchises) {
        if (f.seasons) {
          f.seasons.forEach(s => allMalIdsToFetch.add(s.malId));
        }
      }
    }
    
    const idsArray = Array.from(allMalIdsToFetch);
    if (idsArray.length === 0) return;
    
    const latestStatusMap = new Map();
    
    for (let i = 0; i < idsArray.length; i += 50) {
      const batch = idsArray.slice(i, i + 50);
      const query = \`
        query ($idIn: [Int]) {
          Page {
            media(idMal_in: $idIn, type: ANIME) {
              idMal
              status
            }
          }
        }
      \`;
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { idIn: batch } })
      });
      const json = await response.json();
      const mediaList = json.data?.Page?.media || [];
      for (const media of mediaList) {
        latestStatusMap.set(media.idMal, media.status);
      }
    }
    
    // Update anime_metadata if changed
    if (metadataList) {
      for (const meta of metadataList) {
        const freshStatus = latestStatusMap.get(meta.mal_id);
        if (freshStatus) {
          let mapped = 'Finished Airing';
          if (freshStatus === 'RELEASING') mapped = 'Releasing';
          else if (freshStatus === 'NOT_YET_RELEASED') mapped = 'Not yet aired';
          
          if (meta.status !== mapped) {
            await supabase.from('anime_metadata').update({ status: mapped }).eq('mal_id', meta.mal_id);
          }
        }
      }
    }
    
    // Update franchises if changed
    if (franchises) {
      for (const f of franchises) {
        let changed = false;
        if (!f.seasons) continue;
        const newSeasons = f.seasons.map(s => {
          const freshStatus = latestStatusMap.get(s.malId);
          if (freshStatus && s.status !== freshStatus) {
            changed = true;
            return { ...s, status: freshStatus };
          }
          return s;
        });
        if (changed) {
          await supabase.from('franchises').update({ seasons: newSeasons }).eq('franchise_id', f.franchise_id);
        }
      }
    }
    
    localStorage.setItem('lastStaleDataSync', now.toString());
    console.log("Stale data sync complete.");
  } catch (err) {
    console.error("Failed to sync stale data", err);
  }
}
`;

code += syncCode;
fs.writeFileSync('src/services/franchiseService.js', code);
