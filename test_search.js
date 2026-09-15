const query = `
  query($search: String) {
    Page(page: 1, perPage: 5) {
      media(search: $search, type: ANIME) {
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
  body: JSON.stringify({ query, variables: { search: 'One Piece' } })
}).then(res => res.json()).then(res => console.log(JSON.stringify(res.data, null, 2))).catch(console.error);
