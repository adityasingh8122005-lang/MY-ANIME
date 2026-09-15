const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// Add import
code = code.replace(
  "import { Loader2",
  "import Stepper from '../components/Stepper';\nimport { Loader2"
);

// Replace the div
const oldDiv = `<div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      max={displayEpisodes || ''}
                      value={userAnime.episodesWatched || 0}
                      onChange={(e) => handleEpisodesChange(e.target.value)}
                      className="w-16 bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none text-center"
                    />
                    <span className="text-zinc-400">/ {displayEpisodes || '?'}</span>
                    <button 
                      onClick={() => handleEpisodesChange((userAnime.episodesWatched || 0) + 1)}
                      disabled={displayEpisodes && userAnime.episodesWatched >= displayEpisodes}
                      className="ml-auto p-2 bg-dark-elevated hover:bg-zinc-700 rounded border border-zinc-700 disabled:opacity-50 transition-colors text-white"
                      title="Increment Episode"
                    >
                      <Plus size={14} />
                    </button>
                  </div>`;

const newDiv = `<div className="flex items-center gap-3">
                    <Stepper 
                      value={userAnime.episodesWatched || 0}
                      max={displayEpisodes || undefined}
                      onChange={(newVal) => handleEpisodesChange(newVal)}
                    />
                    <span className="text-zinc-400 font-medium text-sm mt-0.5">/ {displayEpisodes || '?'} eps</span>
                  </div>`;

if (code.includes('type="number"')) {
    // Basic fallback if exact string matching fails due to spaces
    code = code.replace(oldDiv, newDiv);
    
    // If it still hasn't changed, use a regex or manual substring
    if(code.includes('type="number"')) {
        const regex = /<div className="flex items-center gap-2">\s*<input\s*type="number"[\s\S]*?<\/button>\s*<\/div>/;
        code = code.replace(regex, newDiv);
    }
}

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
