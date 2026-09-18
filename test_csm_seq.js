async function run() {
  const query = `
  query {
    Media(idMal: 44511, type: ANIME) {
      relations {
        edges { relationType node { idMal title { english } format status startDate { year } } }
      }
    }
  }
  `;
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
run();
