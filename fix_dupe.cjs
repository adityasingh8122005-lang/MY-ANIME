const fs = require('fs');
let code = fs.readFileSync('src/pages/FranchiseDetailsPage.jsx', 'utf8');

// Replace everything from <div className="flex flex-wrap gap-4"> down to <h2 className="text-xl font-bold text-white mb-4">Franchise Contents</h2>
const regex = /<div className="flex flex-wrap gap-4">[\s\S]*?<h2 className="text-xl font-bold text-white mb-4">Franchise Contents<\/h2>/;

const correctCode = `<div className="flex flex-wrap gap-4">
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Total Canon</div>
              <div className="text-xl font-bold text-white">{franchise.totalCanon} Eps</div>
            </div>
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Watched</div>
              <div className="text-xl font-bold text-accent">{franchise.totalWatched} Eps</div>
            </div>
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Progress</div>
              <div className="text-xl font-bold text-white">
                {franchise.totalCanon > 0 ? Math.round((franchise.totalWatched / franchise.totalCanon) * 100) : 0}%
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={handleCompleteFranchise}
              disabled={isCompleting || franchise.totalWatched === franchise.totalCanon}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm border border-zinc-700"
            >
              {isCompleting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} className={franchise.totalWatched === franchise.totalCanon ? "text-green-500" : "text-zinc-400"} />}
              {franchise.totalWatched === franchise.totalCanon ? "Completed" : "Mark Franchise Completed"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Franchise Contents</h2>`;

code = code.replace(regex, correctCode);
fs.writeFileSync('src/pages/FranchiseDetailsPage.jsx', code);
