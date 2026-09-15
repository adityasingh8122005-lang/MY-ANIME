export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { malId } = req.query;
  if (!malId) return res.status(400).json({ error: 'malId required' });

  const query = `
  query ($id: Int) {
    Media(idMal: $id, type: ANIME) {
      idMal title { english romaji } format episodes
      relations {
        edges { relationType node { idMal title { english romaji } format episodes coverImage { large } } }
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

    // Find Root
    let currentIdMal = startMedia.idMal;
    while (true) {
      if (visited.has(currentIdMal)) break;
      visited.add(currentIdMal);
      const media = await fetchMedia(currentIdMal);
      if (!media) break;
      const prequel = media.relations.edges.find(e => 
        e.relationType === 'PREQUEL' && ['TV', 'SPECIAL', 'OVA', 'MOVIE'].includes(e.node.format)
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
      
      if (['TV', 'MOVIE', 'SPECIAL', 'OVA'].includes(currentMedia.format)) {
        rawSeasons.push({
          malId: currentMedia.idMal,
          title: currentMedia.title.english || currentMedia.title.romaji,
          format: currentMedia.format,
          episodes: currentMedia.episodes || null,
          poster: currentMedia.coverImage?.large
        });
      }
      
      const sequel = currentMedia.relations.edges.find(e => 
        e.relationType === 'SEQUEL' && ['TV', 'MOVIE', 'SPECIAL', 'OVA'].includes(e.node.format)
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
