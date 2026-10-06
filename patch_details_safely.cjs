const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// 1. Imports
code = code.replace(
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb } from 'lucide-react';",
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb, Star } from 'lucide-react';\nimport { Button } from '../components/ui/Button';\nimport { Card } from '../components/ui/Card';"
);

// 2. Fetch Anilist banner
const fetchAnilistBanner = `
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
      } catch (e) {
        console.error("Banner fetch failed", e);
      }
    }
    fetchBanner();
  }, [id]);
`;
code = code.replace("const [activeTab, setActiveTab] = useState('episodes');", "const [activeTab, setActiveTab] = useState('episodes');\n" + fetchAnilistBanner);

// 3. Loading state
code = code.replace(
  `  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }`,
  `  if (isLoading) {
    return (
      <div className="animate-pulse pb-12 -mt-8 sm:-mt-16">
        <div className="w-full h-[45vh] bg-surface-2 overflow-hidden mb-8" />
        <div className="content-container relative z-10 -mt-32">
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
  }`
);

// 4. Layout structure
code = code.replace(
  `<div className="max-w-5xl mx-auto pb-12">`,
  `<div className="pb-12 -mt-8 sm:-mt-16 relative">
      {/* Cinematic Banner */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[350px] bg-void overflow-hidden pointer-events-none">
        {banner ? (
          <img src={banner} alt="Banner" className="w-full h-full object-cover opacity-60" />
        ) : anime?.poster ? (
          <img src={anime.poster} alt="Banner" className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/40 to-transparent" />
      </div>

      <div className="content-container relative z-10 pt-[15vh] sm:pt-[20vh] max-w-6xl mx-auto">`
);

// 5. Poster UI
code = code.replace(
  `        <div className="w-full md:w-72 shrink-0">
          <div className="rounded-lg overflow-hidden border border-zinc-800 bg-dark-surface shadow-lg">`,
  `        <div className="w-full md:w-64 lg:w-72 shrink-0">
          <div className="rounded-[20px] overflow-hidden border border-white/10 bg-surface-1 shadow-depth-4 mb-6 transition-transform hover:-translate-y-1 duration-300">`
);

// 6. Right column replacement using string manipulation
const rightColStart = code.indexOf('{/* Right Column - Details */}');
// The flex-wrap gap-4 mb-8 block ends just before the synopsis
const nextSectionStart = code.indexOf('          {/* Synopsis removed as requested */}');
if (rightColStart !== -1 && nextSectionStart !== -1) {
  const newRightHeader = `        {/* Right Column - Details */}
        <div className="flex-1 pt-6 md:pt-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {anime.score && (
              <span className="flex items-center gap-1 text-warning font-bold text-caption bg-warning/10 px-2 py-1 rounded">
                <Star size={14} className="fill-warning" />
                {anime.score}
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
            {anime.year && (
              <span className="text-zinc-300 text-caption font-medium px-2 py-1 bg-surface-2 rounded border border-white/5">
                {anime.year}
              </span>
            )}
            {userAnime?.personalRating && (
              <span className="text-primary text-caption font-bold px-2 py-1 bg-primary/10 rounded border border-primary/20">
                My Rating: {userAnime.personalRating}/10
              </span>
            )}
          </div>

          <h1 className="text-h1 sm:text-display-m font-bold text-white mb-2 leading-tight drop-shadow-md">
            {anime.title_english || anime.title}
          </h1>
          {anime.title_japanese && (
            <h2 className="text-h4 text-zinc-400 mb-6 font-medium font-mono drop-shadow-sm">{anime.title_japanese}</h2>
          )}
\n`;
  code = code.substring(0, rightColStart) + newRightHeader + code.substring(nextSectionStart);
}

// 7. Make genres compact
const genresIndexStart = code.indexOf('          {(anime.genres?.length > 0 || anime.themes?.length > 0) && (');
if (genresIndexStart !== -1) {
    const genresIndexEnd = code.indexOf('          {anime.alternativeTitles?.length > 0 && (');
    if(genresIndexEnd !== -1) {
        const newGenres = `          {(anime.genres?.length > 0 || anime.themes?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-8 mt-6">
                {anime.genres?.slice(0, 4).map(genre => (
                  <span key={genre} className="px-3 py-1 bg-primary/10 text-primary text-micro font-bold uppercase rounded-full border border-primary/20">
                    {genre}
                  </span>
                ))}
            </div>
          )}
\n`;
        code = code.substring(0, genresIndexStart) + newGenres + code.substring(genresIndexEnd);
    }
}


// 8. Description formatting
code = code.replace(
  `          {anime.synopsis && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Synopsis</h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{anime.synopsis}</p>
            </div>
          )}`,
  `          {anime.synopsis && (
            <div className="mb-8 max-w-3xl">
              <p className="text-zinc-300 text-body-m leading-relaxed whitespace-pre-wrap">{anime.synopsis}</p>
            </div>
          )}`
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
