const fs = require('fs');

let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Import Tilt
code = code.replace(
  "import { Flame, Loader2, Dices } from 'lucide-react';",
  "import { Flame, Loader2, Dices } from 'lucide-react';\nimport Tilt from 'react-parallax-tilt';"
);

// Wrap Link in Tilt
const originalLink = '<Link key={anime.idMal} to={`/anime/${anime.idMal}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-zinc-500 transition-colors">';
const newLink = `<Tilt key={anime.idMal} tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.03} transitionSpeed={400} className="rounded-lg h-full">
          <Link to={\`/anime/\${anime.idMal}\`} className="h-full block group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors hover:shadow-lg hover:shadow-accent/20">`;

code = code.replace(originalLink, newLink);

// Close Tilt
code = code.replace(
  `            </div>\n          </Link>\n        ))}`,
  `            </div>\n          </Link>\n        </Tilt>\n        ))}`
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
