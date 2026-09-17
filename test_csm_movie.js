async function run() {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ Media(idMal: 57555, type: ANIME) { status } }' })
  });
  const json = await response.json();
  console.log(json);
}
run();
