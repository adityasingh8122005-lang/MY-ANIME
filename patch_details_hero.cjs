const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// We need to add Button and Star
code = code.replace(
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb } from 'lucide-react';",
  "import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb, Star } from 'lucide-react';\nimport { Button } from '../components/ui/Button';\nimport { Card } from '../components/ui/Card';"
);

// We need to fetch AniList banner
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

code = code.replace(
  "const [activeTab, setActiveTab] = useState('episodes');",
  "const [activeTab, setActiveTab] = useState('episodes');\n" + fetchAnilistBanner
);

// Better loading/error state
code = code.replace(
  `  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Anime not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-accent hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }`,
  `  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="w-full h-[50vh] bg-surface-2 rounded-xl mb-8" />
        <div className="content-container">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 h-96 bg-surface-2 rounded-xl shrink-0 -mt-32 relative z-10" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-surface-2 rounded w-1/3" />
              <div className="h-4 bg-surface-2 rounded w-1/4" />
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
  }

  if (error || !anime) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <XCircle size={48} className="text-error mb-4" />
        <p className="text-zinc-400 mb-6">{error || 'Unable to load this anime.'}</p>
        <Button onClick={() => navigate(-1)} variant="secondary" icon={ArrowLeft}>Back</Button>
      </div>
    );
  }`
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
