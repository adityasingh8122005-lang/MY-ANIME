const fs = require('fs');

let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

code = code.replace(
  `      episodes\n      status`,
  `      episodes\n      status\n      description\n      genres\n      averageScore`
);

// We should replace AnimatedAnimeBackground usage with our CinematicHero
code = code.replace(
  `import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';`,
  `import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';\nimport CinematicHero from '../components/layout/CinematicHero';`
);

// Insert CinematicHero before the grid
code = code.replace(
  `<div className="mb-8 text-center pt-8">`,
  `{trending.length > 0 && <CinematicHero animeList={trending.slice(0, 5)} />}\n\n      <div className="mb-8 text-center pt-8">`
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
