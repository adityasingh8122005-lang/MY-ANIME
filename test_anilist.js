const query = `
query ($page: Int, $genre: String, $format: MediaFormat) {
  Page(page: $page, perPage: 50) {
    media(type: ANIME, genre: $genre, format: $format, sort: SCORE_DESC, isAdult: false) {
      idMal
      title { romaji english }
      coverImage { large }
      episodes
      status
      genres
      averageScore
    }
  }
}
`;

async function test() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { page: Math.floor(Math.random() * 5) + 1, format: 'TV' }
    })
  });
  const json = await res.json();
  const animeList = json.data.Page.media.filter(a => a.idMal);
  const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];
  console.log(randomAnime);
}
test();
