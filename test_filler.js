const https = require('https');
async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://api.allorigins.win/get?url=https://www.animefillerlist.com/shows/naruto');
  const data = await res.json();
  const html = data.contents;
  console.log(html.substring(0, 200));
}
test();
