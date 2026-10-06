const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// 1. imports
code = code.replace(
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb } from 'lucide-react';",
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb, Star } from 'lucide-react';\nimport { Button } from '../components/ui/Button';\nimport { Card } from '../components/ui/Card';"
);

// 2. ReadMore Component
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
code = code.replace("export default function AnimeDetailsPage() {", readMoreComponent + "\nexport default function AnimeDetailsPage() {");

// 3. Banner Fetch Hook
code = code.replace(
  "const [activeTab, setActiveTab] = useState('episodes');",
  `const [activeTab, setActiveTab] = useState('episodes');
  const [banner, setBanner] = useState(null);
  useEffect(() => {
    if (!id) return;
    async function fetchBanner() {
      try {
        const query = \`query($id: Int) { Media(idMal: $id, type: ANIME) { bannerImage coverImage { extraLarge } } }\`;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { id: parseInt(id) } })
        });
        const json = await res.json();
        const media = json.data?.Media;
        if (media) setBanner(media.bannerImage || media.coverImage?.extraLarge);
      } catch (e) {}
    }
    fetchBanner();
  }, [id]);`
);

// 4. Loading state replacement
const oldLoading = `  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }`;
const newLoading = `  if (isLoading) {
    return (
      <div className="animate-pulse pb-12 -mt-8 sm:-mt-16">
        <div className="w-full h-[45vh] bg-surface-2 overflow-hidden mb-8" />
        <div className="content-container relative z-10 -mt-32 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 lg:w-72 h-96 bg-surface-2 rounded-[20px] shrink-0" />
            <div className="flex-1 space-y-4 pt-12">
              <div className="h-10 bg-surface-2 rounded w-1/2" />
              <div className="h-6 bg-surface-2 rounded w-1/4" />
              <div className="space-y-2 mt-8">
                <div className="h-4 bg-surface-2 rounded w-full" />
                <div className="h-4 bg-surface-2 rounded w-full" />
                <div className="h-4 bg-surface-2 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }`;
code = code.replace(oldLoading, newLoading);

// 5. Layout Top Wrapper
const oldWrapper = `  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Poster & Actions */}
        <div className="w-full md:w-72 shrink-0">
          <div className="rounded-lg overflow-hidden border border-zinc-800 bg-dark-surface shadow-lg">`;
const newWrapper = `  return (
    <div className="pb-12 -mt-8 sm:-mt-16 relative">
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[350px] bg-void overflow-hidden pointer-events-none z-0">
        {banner ? (
          <img src={banner} alt="Banner" className="w-full h-full object-cover opacity-60" />
        ) : anime?.poster ? (
          <img src={anime.poster} alt="Banner" className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/40 to-transparent" />
      </div>

      <div className="content-container relative z-10 pt-[15vh] sm:pt-[20vh] max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors focus-visible-ring rounded">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Poster & Actions */}
          <div className="w-full md:w-64 lg:w-72 shrink-0">
            <div className="rounded-[20px] overflow-hidden border border-white/10 bg-surface-1 shadow-depth-4 mb-6 transition-transform hover:-translate-y-1 duration-300">`;
code = code.replace(oldWrapper, newWrapper);


// 6. Right Column Replacement using dynamic substring extraction between {/ Right Column - Details /} and fillerStats
const rightColStart = code.indexOf('{/* Right Column - Details */}');
const fillerStatsStart = code.indexOf('{fillerStats && (');

if (rightColStart !== -1 && fillerStatsStart !== -1) {
  const newRightHeader = `        {/* Right Column - Details */}
        <div className="flex-1 pt-6 md:pt-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {imdbScore && (
              <span className="flex items-center gap-1 text-warning font-bold text-caption bg-warning/10 px-2 py-1 rounded">
                <Star size={14} className="fill-warning" />
                {imdbScore}
              </span>
            )}
            {displayEpisodes && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {displayEpisodes} Episodes
              </span>
            )}
            {anime.status && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {anime.status}
              </span>
            )}
            {anime.season && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5 capitalize">
                {anime.season} {anime.year}
              </span>
            )}
            {userAnime?.personalRating && (
              <span className="text-primary text-caption font-bold px-2 py-1 bg-primary/10 rounded border border-primary/20">
                My Rating: {userAnime.personalRating}/10
              </span>
            )}
          </div>

          <h1 className="text-h1 sm:text-display-m font-bold text-white mb-2 leading-tight drop-shadow-md">
            {anime.title}
          </h1>
          {anime.japaneseTitle && (
            <h2 className="text-h4 text-zinc-400 mb-6 font-medium font-mono drop-shadow-sm">{anime.japaneseTitle}</h2>
          )}

          {(anime.genres?.length > 0 || anime.themes?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-8 mt-6">
                {anime.genres?.slice(0, 4).map(genre => (
                  <span key={genre} className="px-3 py-1 bg-primary/10 text-primary text-micro font-bold uppercase rounded-full border border-primary/20">
                    {genre}
                  </span>
                ))}
            </div>
          )}

          <div className="mb-8 max-w-3xl">
             <ReadMore text={anime.synopsis} maxLength={350} />
          </div>

          `;
          
  code = code.substring(0, rightColStart) + newRightHeader + code.substring(fillerStatsStart);
}

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
