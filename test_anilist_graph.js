const query = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { english romaji }
    format
    episodes
    relations {
      edges {
        relationType
        node {
          id
          title { english romaji }
          format
          episodes
        }
      }
    }
  }
}
`;

async function getMedia(id) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id } })
  });
  return (await res.json()).data.Media;
}

async function buildFranchise(startId) {
  const visited = new Set();
  const seasons = [];
  
  // Find root
  let currentId = startId;
  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    
    const media = await getMedia(currentId);
    if (!media) break;
    
    const prequel = media.relations.edges.find(e => e.relationType === 'PREQUEL' && e.node.format === 'TV');
    if (prequel) {
      currentId = prequel.node.id;
    } else {
      break;
    }
  }
  
  // Now currentId is the root. Walk sequels.
  visited.clear();
  let rootId = currentId;
  let currentMedia = await getMedia(rootId);
  
  while (currentMedia) {
    if (visited.has(currentMedia.id)) break;
    visited.add(currentMedia.id);
    
    if (currentMedia.format === 'TV') {
      seasons.push({
        id: currentMedia.id,
        title: currentMedia.title.english || currentMedia.title.romaji,
        episodes: currentMedia.episodes
      });
    }
    
    const sequel = currentMedia.relations.edges.find(e => e.relationType === 'SEQUEL' && e.node.format === 'TV');
    if (sequel) {
      currentMedia = await getMedia(sequel.node.id);
    } else {
      break;
    }
  }
  
  console.log(seasons);
}

buildFranchise(16498);
