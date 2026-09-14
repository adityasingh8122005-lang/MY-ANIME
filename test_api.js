async function run() {
  const query = `
  query ($id: Int) {
    Media(idMal: $id, type: ANIME) {
      id
      idMal
      title { english romaji }
      format
      episodes
      relations {
        edges {
          relationType
          node { id idMal title { english romaji } format episodes coverImage { large } }
        }
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
  const media = await fetchMedia(16498);
  console.log(media.title);
}
run();
