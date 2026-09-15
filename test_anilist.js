const query = `
  query($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      idMal
      title { english romaji native }
      episodes
      status
    }
  }
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { idMal: 21 } })
}).then(res => res.json()).then(console.log).catch(console.error);
