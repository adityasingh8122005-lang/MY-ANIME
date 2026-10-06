const fs = require('fs');

let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// We simply parse lines and replace specific lines based on known line contents.
const lines = code.split('\n');
const out = [];

let inRightColumn = false;
let inLoading = false;

// We need to inject the Anilist banner state near the top of the component.
let injectedBannerState = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes("import { Loader2")) {
    out.push("import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb, Star } from 'lucide-react';");
    out.push("import { Button } from '../components/ui/Button';");
    out.push("import { Card } from '../components/ui/Card';");
    continue;
  }

  if (line.includes("const [activeTab, setActiveTab] = useState('episodes');")) {
    out.push(line);
    if (!injectedBannerState) {
      out.push(`
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
      `);
      injectedBannerState = true;
    }
    continue;
  }

  if (line.includes("if (isLoading) {")) {
    inLoading = true;
    out.push(`  if (isLoading) {
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
    );`);
    continue;
  }

  if (inLoading && line.trim() === "}") {
    inLoading = false;
    out.push("  }");
    continue;
  }

  if (inLoading) continue; // skip old loading lines

  if (line.includes('<div className="max-w-5xl mx-auto pb-12">')) {
    out.push(`  return (
    <div className="pb-12 -mt-8 sm:-mt-16 relative">
      {/* Cinematic Banner */}
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
            <div className="rounded-[20px] overflow-hidden border border-white/10 bg-surface-1 shadow-depth-4 mb-6 transition-transform hover:-translate-y-1 duration-300">
              {anime.poster ? (
                <img src={anime.poster} alt={anime.title} className="w-full object-cover aspect-[2/3]" />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center text-zinc-600 bg-zinc-900">No Image</div>
              )}
            </div>`);
    // Skip old lines up to "mt-4 flex flex-col gap-3"
    let j = i;
    while (!lines[j].includes('className="mt-4 flex flex-col gap-3"')) {
      j++;
    }
    i = j - 1; // loop will increment it to j
    continue;
  }

  // Right column start
  if (line.includes('{/* Right Column - Details */}')) {
    inRightColumn = true;
    out.push(`        {/* Right Column - Details */}
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

          {(anime.genres?.length > 0 || anime.themes?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-8 mt-6">
                {anime.genres?.slice(0, 4).map(genre => (
                  <span key={genre} className="px-3 py-1 bg-primary/10 text-primary text-micro font-bold uppercase rounded-full border border-primary/20">
                    {genre}
                  </span>
                ))}
            </div>
          )}

          {anime.synopsis && (
            <div className="mb-8 max-w-3xl">
              <p className="text-zinc-300 text-body-m leading-relaxed whitespace-pre-wrap">{anime.synopsis}</p>
            </div>
          )}
`);
    continue;
  }

  // End of right column skip section is when we hit the Synopsis area
  // Wait, I already replaced up to Synopsis. Where does the next valid block start?
  if (inRightColumn) {
    if (line.includes('{/* Tabs Section */}')) {
      inRightColumn = false;
      out.push(line);
    }
    continue;
  }

  out.push(line);
}

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', out.join('\n'));
