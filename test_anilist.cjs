const TRENDING_QUERY = `
query {
  Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
      idMal
      coverImage { large }
      bannerImage
    }
  }
}
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: TRENDING_QUERY })
})
.then(res => res.json())
.then(json => {
  const media = json.data.Page.media.filter(a => a.idMal);
  const validImages = media.map(a => a?.bannerImage || a?.coverImage?.large).filter(Boolean).slice(0, 6);
  console.log("validImages.length:", validImages.length);
  console.log(validImages);
});
