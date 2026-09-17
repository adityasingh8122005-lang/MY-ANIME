async function run() {
  const query = `
    query {
      Page {
        media(search: "Infinity Castle", type: ANIME) {
          idMal
          title { english romaji }
          format
        }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  console.log(JSON.stringify(json.data.Page.media, null, 2));
}
run();
