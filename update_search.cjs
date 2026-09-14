const fs = require('fs');

const file = 'src/pages/SearchPage.jsx';
let code = fs.readFileSync(file, 'utf8');

// Insert the groupFranchises function outside the component
const groupFn = `
function groupFranchises(results) {
  const sorted = [...results].sort((a, b) => (a.year || 9999) - (b.year || 9999));
  const groups = [];
  const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\\s+/g, ' ').trim() : '';

  sorted.forEach(anime => {
    const titleNorm = normalize(anime.englishTitle || anime.title);
    const romajiNorm = normalize(anime.title);
    
    let matchedGroup = null;
    for (let group of groups) {
      const gTitleNorm = normalize(group.main.englishTitle || group.main.title);
      const gRomajiNorm = normalize(group.main.title);
      
      if (
         (gTitleNorm.length > 3 && titleNorm.startsWith(gTitleNorm)) || 
         (gRomajiNorm.length > 3 && romajiNorm.startsWith(gRomajiNorm))
      ) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.items.push(anime);
    } else {
      groups.push({ main: anime, items: [anime] });
    }
  });
  return groups;
}

export default function SearchPage() {`;

code = code.replace('export default function SearchPage() {', groupFn);

// Replace the grid rendering
const oldGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((anime) => (
          <Link key={anime.malId} to={\`/anime/\${anime.malId}\`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
            <div className="aspect-[2/3] w-full bg-zinc-900 relative">
              {anime.poster ? (
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-medium text-sm text-zinc-100 line-clamp-2" title={anime.title}>
                {anime.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-auto pt-2">
                {anime.year ? anime.year : 'Unknown Year'} • {anime.episodes ? \`\${anime.episodes} eps\` : 'Ongoing'}
              </p>
            </div>
          </Link>
        ))}
      </div>`;

const newGrid = `
      <div className="flex flex-col gap-8">
        {groupFranchises(results).map((group) => (
          <div key={group.main.malId} className="flex flex-col gap-4 bg-dark-surface border border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-white pl-3 border-l-4 border-accent">
              {group.items.length > 1 ? \`\${group.main.englishTitle || group.main.title} (Franchise)\` : (group.main.englishTitle || group.main.title)}
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-2 snap-x scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {group.items.map((anime) => (
                <Link key={anime.malId} to={\`/anime/\${anime.malId}\`} className="shrink-0 w-36 sm:w-40 snap-start group relative rounded-lg overflow-hidden bg-dark-base border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
                  <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                    {anime.poster ? (
                      <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={anime.title}>
                      {anime.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-auto pt-2">
                      {anime.year ? anime.year : 'Unknown Year'} • {anime.episodes ? \`\${anime.episodes} eps\` : 'Ongoing'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
`;

code = code.replace(oldGrid, newGrid);

fs.writeFileSync(file, code);
console.log("Updated SearchPage.jsx");
