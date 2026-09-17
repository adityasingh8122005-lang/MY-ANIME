async function run() {
  const query = `
  query ($id: Int) {
    Media(idMal: $id, type: ANIME) {
      idMal title { english romaji } format episodes status
      relations {
        edges { relationType node { idMal title { english romaji } format episodes status coverImage { large } } }
      }
      coverImage { large }
    }
  }
  `;

  const fetchMedia = async (idMal) => {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: parseInt(idMal) } })
    });
    const json = await response.json();
    return json.data?.Media;
  };

  const startMedia = await fetchMedia(50273);
  let currentIdMal = startMedia.idMal;
  
  const visited = new Set();
  const rawSeasons = [];

  while (true) {
    if (visited.has(currentIdMal)) break;
    visited.add(currentIdMal);
    const media = await fetchMedia(currentIdMal);
    if (!media) break;
    const prequel = media.relations.edges.find(e => 
      e.relationType === 'PREQUEL' && ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format)
    );
    if (prequel && prequel.node.idMal) currentIdMal = prequel.node.idMal;
    else break;
  }

  visited.clear();
  let currentMedia = await fetchMedia(currentIdMal);
  while (currentMedia) {
    if (visited.has(currentMedia.idMal)) break;
    visited.add(currentMedia.idMal);
    
    if (['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(currentMedia.format)) {
      rawSeasons.push({
        malId: currentMedia.idMal,
        title: currentMedia.title.english || currentMedia.title.romaji,
        format: currentMedia.format,
      });
    }
    
    const sequel = currentMedia.relations.edges.find(e => 
      e.relationType === 'SEQUEL' && ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'TV_SHORT'].includes(e.node.format)
    );
    if (sequel && sequel.node.idMal) currentMedia = await fetchMedia(sequel.node.idMal);
    else break;
  }
  
  console.log("Raw Seasons:");
  console.log(rawSeasons);
}
run();
