const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

const readMoreComponent = `
const ReadMore = ({ text, maxLength = 300 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLength) return <p className="text-body-m text-zinc-300 leading-relaxed">{text}</p>;
  return (
    <div>
      <p className="text-body-m text-zinc-300 leading-relaxed inline">
        {expanded ? text : text.slice(0, maxLength) + '...'}
      </p>
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="ml-2 text-primary hover:text-primary-hover font-medium focus-visible-ring rounded transition-colors"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
};
`;

code = code.replace("export default function AnimeDetailsPage", readMoreComponent + "\nexport default function AnimeDetailsPage");

// Now replacing the Right Column
const newRightColumn = `
        {/* Right Column - Details */}
        <div className="flex-1 mt-6 md:mt-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {anime.score && (
              <span className="flex items-center gap-1 text-warning font-bold text-caption bg-warning/10 px-2 py-1 rounded">
                <Star size={14} className="fill-warning" />
                {anime.score}
              </span>
            )}
            {anime.episodes && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {anime.episodes} Episodes
              </span>
            )}
            {anime.status && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {anime.status}
              </span>
            )}
            {anime.year && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {anime.year}
              </span>
            )}
          </div>

          <h1 className="text-h1 sm:text-display-m font-bold text-white mb-2 leading-tight">
            {anime.title_english || anime.title}
          </h1>
          {anime.title_japanese && (
            <h2 className="text-h4 text-zinc-400 mb-6 font-medium font-mono">{anime.title_japanese}</h2>
          )}

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {anime.genres.slice(0, 4).map(g => (
                <span key={g.name || g} className="text-micro font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 tracking-wide uppercase">
                  {g.name || g}
                </span>
              ))}
            </div>
          )}

          <div className="max-w-3xl mb-10">
            <ReadMore text={anime.description} maxLength={350} />
          </div>

          <div className="flex items-center gap-4 mb-12">
             {!userAnime ? (
               <Button onClick={handleAddFranchise} variant="premium" icon={Plus}>
                 Add to Collection
               </Button>
             ) : (
               <Button variant="secondary" className="glass-panel text-primary border-primary/30" onClick={() => setActiveTab('episodes')}>
                 {isCaughtUp ? 'Caught Up' : isFinished ? 'Completed' : \`Continue Episode \${(userAnime.episodesWatched || 0) + 1}\`}
               </Button>
             )}
          </div>
`;

code = code.replace(
  /\{\/\* Right Column - Details \*\/\}([\s\S]*?)<div className="border-b border-zinc-800 mb-8 overflow-x-auto">/,
  newRightColumn + '\n\n<div className="border-b border-white/10 mb-8 overflow-x-auto">'
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
