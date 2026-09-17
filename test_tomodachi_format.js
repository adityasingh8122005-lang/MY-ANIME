async function run() {
  const query = `
    query {
      Media(search: "Tomodachi Game", type: ANIME) {
        idMal
        format
        episodes
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  console.log(JSON.stringify(json.data, null, 2));
}
run();
