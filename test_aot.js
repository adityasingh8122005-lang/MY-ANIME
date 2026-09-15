const malId = 16498;
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

    const fetchMedia = async (idMal) => {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { id: parseInt(idMal) } })
      });
      const json = await response.json();
      return json.data?.Media;
    };

    fetchMedia(malId).then(m => console.log(m ? "Found" : "Not Found"));
