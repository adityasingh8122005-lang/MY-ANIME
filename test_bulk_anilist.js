async function run() {
  const query = `
    query ($idIn: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $idIn, type: ANIME) {
          idMal
          status
        }
      }
    }
  `;
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { idIn: [44511, 57555, 50273, 21, 20] } })
  });
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
run();
