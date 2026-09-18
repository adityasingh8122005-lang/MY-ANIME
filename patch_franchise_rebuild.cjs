const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

const syncCode = `
export async function autoRebuildFranchises() {
  const lastRebuild = localStorage.getItem('lastFranchiseRebuild');
  const now = Date.now();
  // Rebuild once every 7 days
  if (lastRebuild && now - parseInt(lastRebuild) < 7 * 24 * 60 * 60 * 1000) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  console.log("Running weekly franchise rebuild...");
  
  try {
    const { data: franchises } = await supabase.from('franchises').select('franchise_id');
    if (!franchises || franchises.length === 0) return;
    
    const { getFranchiseData } = await import('./franchiseApi');
    
    // We will rebuild 1 franchise every 2 seconds to avoid rate limits on client side
    let i = 0;
    const processNext = async () => {
      if (i >= franchises.length) {
        localStorage.setItem('lastFranchiseRebuild', now.toString());
        console.log("Weekly franchise rebuild complete.");
        return;
      }
      const f = franchises[i];
      const rootId = f.franchise_id.replace('franchise_', '');
      try {
        const freshData = await getFranchiseData(rootId);
        if (freshData && freshData.seasons) {
          await supabase.from('franchises').update({ seasons: freshData.seasons }).eq('franchise_id', f.franchise_id);
        }
      } catch (e) {
        console.error("Failed to rebuild", f.franchise_id, e);
      }
      
      i++;
      setTimeout(processNext, 2000); // 2 second delay between requests
    };
    
    processNext();
    
  } catch (err) {
    console.error("Failed to rebuild franchises", err);
  }
}
`;

code += syncCode;
fs.writeFileSync('src/services/franchiseService.js', code);
