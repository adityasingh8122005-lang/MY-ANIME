const query = `
query {
  Page(page: 1, perPage: 10) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      idMal
      title { english romaji }
      relations {
        edges {
          relationType
        }
      }
    }
  }
}
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(data => {
  const media = data.data.Page.media;
  media.forEach(m => {
    const isSequel = m.relations?.edges?.some(e => ['PREQUEL', 'PARENT'].includes(e.relationType));
    console.log(m.title.english || m.title.romaji, "| Is Sequel/Spinoff:", !!isSequel);
  });
});
