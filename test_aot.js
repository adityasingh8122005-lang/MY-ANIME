const query = `
query {
  Media(id: 131681, type: ANIME) {
    id
    title { english romaji }
    relations {
      edges {
        relationType
        node { id title { english romaji } format episodes }
      }
    }
  }
}
`;
async function test() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
test();
