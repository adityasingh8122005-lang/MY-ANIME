async function run() {
  const query = `
    query {
      Media(idMal: 57658, type: ANIME) {
        relations {
          edges { relationType node { idMal title { english } status format } }
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
