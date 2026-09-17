import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/franchise?malId=50273');
  // Wait, I don't have the dev server running. Let's start it or just run the logic manually.
}
run();
