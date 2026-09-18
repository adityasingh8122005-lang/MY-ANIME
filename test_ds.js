async function run() {
  const query = `
    query {
      Media(idMal: 59192, type: ANIME) {
        idMal title { english romaji } status startDate { year month day }
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
