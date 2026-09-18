async function run() {
  const query = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        title { english romaji }
        relations {
          edges { relationType node { type format status title { english romaji } } }
        }
      }
    }
  `;
  const fetchAnime = async (id) => {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id } })
    });
    return (await res.json()).data.Media;
  };
  
  console.log("AOT (Finished):", JSON.stringify(await fetchAnime(16498), null, 2));
  console.log("JJK (Ongoing Manga):", JSON.stringify(await fetchAnime(40748), null, 2));
  console.log("No Game No Life (Hiatus LN):", JSON.stringify(await fetchAnime(19815), null, 2));
}
run();
