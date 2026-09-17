async function run() {
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
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: 50273 } })
  });
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
run();
