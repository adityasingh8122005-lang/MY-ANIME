const query = `
  query {
    Page(page: 1, perPage: 50) {
      media(search: "One Piece", type: ANIME, episodes: 1) {
        idMal
        title { english romaji }
        episodes
        status
        season
      }
    }
  }
`;
fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(res => console.log(JSON.stringify(res.data, null, 2))).catch(console.error);
