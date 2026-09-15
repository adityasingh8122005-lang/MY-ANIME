const query = `
  query {
    Media(idMal: 459, type: ANIME) {
      idMal
      title { english romaji native }
      episodes
      coverImage { large }
    }
  }
`;
fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);
