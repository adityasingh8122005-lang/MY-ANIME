async function run() {
  const query = `
  query {
    Media(idMal: 57555, type: ANIME) {
      idMal
      title { romaji english }
      status
      format
      startDate { year month day }
      endDate { year month day }
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
