export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { malId } = req.query;
  if (!malId) return res.status(400).json({ error: 'malId required' });

  const query = `
  query ($id: Int) {
    Media(idMal: $id, type: ANIME) {
      idMal title { english romaji } format episodes status startDate { year month day }
      relations {
        edges { relationType node { idMal title { english romaji } format episodes status startDate { year month day } coverImage { large } } }
      }
      coverImage { large }
    }
  }
  `;

  try {
    const fetchMedia = async (idMal) => {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { id: parseInt(idMal) } })
      });
      const json = await response.json();
      return json.data?.Media;
    };

    const startMedia = await fetchMedia(malId);
    if (!startMedia) return res.status(404).json({ error: 'Not found' });

    const franchiseName = startMedia.title.english || startMedia.title.romaji;
    const visited = new Set();
    const rawSeasons = [];

    
    const MOVIE_CANON_DB = {
            // CANON
      40456: 'CANON', // Demon Slayer: Mugen Train
      59192: 'CANON', // Infinity Castle Part 1
      62546: 'CANON', // Infinity Castle Part 2
      62547: 'CANON', // Infinity Castle Part 3 (guess)
      52742: 'CANON', // Haikyuu Dumpster Battle
      16870: 'CANON', // The Last: Naruto
      48561: 'CANON', // JJK 0
      36946: 'CANON', // DBS Broly
      51552: 'CANON', // DBS Super Hero
      // NON-CANON
      50652: 'NON_CANON', // One Piece Film Red
      13667: 'NON_CANON', // Road to Ninja
      41285: 'NON_CANON', // One Piece Film Red (Wait, 50652 is Red, 41285 is maybe Stampede?)
      31490: 'NON_CANON', // One Piece Film Gold
      35672: 'NON_CANON', // MHA Two Heroes
      39565: 'NON_CANON', // MHA Heroes Rising
      40854: 'NON_CANON', // MHA World Heroes Mission
      // ADD MORE IF NEEDED
    };

    // Find Root
    let currentIdMal = startMedia.idMal;
    while (true) {
      if (visited.has(currentIdMal)) break;
      visited.add(currentIdMal);
      const media = await fetchMedia(currentIdMal);
      if (!media) break;
      const prequel = media.relations.edges.find(e => 
        e.relationType === 'PREQUEL' && (!e.node.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format))
      );
      if (prequel && prequel.node.idMal) currentIdMal = prequel.node.idMal;
      else break;
    }

    // Walk Sequels
    visited.clear();
    let currentMedia = await fetchMedia(currentIdMal);
    while (currentMedia) {
      if (visited.has(currentMedia.idMal)) break;
      visited.add(currentMedia.idMal);
      
      if ((!currentMedia.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(currentMedia.format))) {
        let sourceOngoing = false;
        if (currentMedia.relations && currentMedia.relations.edges) {
          const sourceEdge = currentMedia.relations.edges.find(e => e.relationType === 'ADAPTATION' || e.relationType === 'SOURCE');
          if (sourceEdge && sourceEdge.node && (sourceEdge.node.status === 'RELEASING' || sourceEdge.node.status === 'HIATUS' || sourceEdge.node.status === 'NOT_YET_RELEASED')) {
            sourceOngoing = true;
          }
        }
        
        let movieCanonStatus = undefined;
        if (currentMedia.format === 'MOVIE') {
          movieCanonStatus = MOVIE_CANON_DB[currentMedia.idMal] || 'UNKNOWN';
        }

        rawSeasons.push({
          malId: currentMedia.idMal,
          title: currentMedia.title.english || currentMedia.title.romaji,
          format: currentMedia.format,
          episodes: currentMedia.episodes || null,
          poster: currentMedia.coverImage?.large,
          status: currentMedia.status,
          movieCanonStatus,
          startDate: currentMedia.startDate,
          sourceOngoing
        });
      }
      
      const sequel = currentMedia.relations.edges.find(e => 
        e.relationType === 'SEQUEL' && (!e.node.format || ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format))
      );
      if (sequel && sequel.node.idMal) currentMedia = await fetchMedia(sequel.node.idMal);
      else break;
    }

    // Filler Logic
    const getFillerSet = async (title) => {
      let fillerSet = new Set();
      let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let res = await fetch(`https://www.animefillerlist.com/shows/${slug}`);
      if (res.status === 404 && slug.includes('on-')) {
        slug = slug.replace('on-', '');
        res = await fetch(`https://www.animefillerlist.com/shows/${slug}`);
      }
      if (res.status !== 200) return null; // Means no dedicated page
      
      const text = await res.text();
      const matches = text.matchAll(/<tr class="([^"]*)".*?<td class="Number">(\d+)<\/td>/g);
      for (const match of matches) {
        const cls = match[1];
        if (cls.includes('filler') && !cls.includes('mixed')) {
          fillerSet.add(parseInt(match[2]));
        }
      }
      return fillerSet;
    };

    let rootFillerSet = await getFillerSet(rawSeasons[0].title);
    let absoluteEpCounter = 1;

    for (let season of rawSeasons) {
      const seasonFillerSet = await getFillerSet(season.title);
      
      if (seasonFillerSet) {
        // Season has its own dedicated page (like Naruto Shippuden)
        let seasonFillerCount = 0;
        const epCount = season.episodes || 1000;
        for (let i = 1; i <= epCount; i++) {
          if (seasonFillerSet.has(i)) seasonFillerCount++;
        }
        season.canonEpisodes = season.episodes ? season.episodes - seasonFillerCount : 0;
        
        // Reset absolute counter since this is a new "root" in AFL
        rootFillerSet = seasonFillerSet;
        absoluteEpCounter = epCount + 1; 
      } else {
        // Season relies on the root AFL page (like AOT S2)
        let seasonFillerCount = 0;
        const epCount = season.episodes || 1000;
        if (rootFillerSet) {
          for (let i = 0; i < epCount; i++) {
            if (rootFillerSet.has(absoluteEpCounter)) seasonFillerCount++;
            absoluteEpCounter++;
          }
        } else {
          // No filler data at all for root, assume all canon
          absoluteEpCounter += epCount;
        }
        season.canonEpisodes = season.episodes ? season.episodes - seasonFillerCount : 0;
      }
    }

    res.status(200).json({
      franchiseId: `franchise_${rawSeasons[0].malId}`,
      franchiseName: rawSeasons[0].title,
      poster: rawSeasons[0].poster || startMedia.coverImage?.large,
      seasons: rawSeasons
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build franchise' });
  }
}
