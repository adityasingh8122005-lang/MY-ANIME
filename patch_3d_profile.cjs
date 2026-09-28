const fs = require('fs');

let code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');

// Import Tilt
code = code.replace(
  "import { UserCircle, Calendar, ShieldAlert, Tv } from 'lucide-react';",
  "import { UserCircle, Calendar, ShieldAlert, Tv } from 'lucide-react';\nimport Tilt from 'react-parallax-tilt';"
);

// Wrap Link in Tilt
const originalLink = '<Link key={anime.malId} to={`/anime/${anime.malId}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-zinc-500 transition-colors">';
const newLink = `<Tilt key={anime.malId} tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.03} transitionSpeed={400} className="rounded-lg h-full">
              <Link to={\`/anime/\${anime.malId}\`} className="h-full block group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors hover:shadow-lg hover:shadow-accent/20">`;

code = code.replace(originalLink, newLink);

// Close Tilt
code = code.replace(
  `                </p>\n              </div>\n            </Link>\n          ))}`,
  `                </p>\n              </div>\n            </Link>\n            </Tilt>\n          ))}`
);

fs.writeFileSync('src/pages/ProfilePage.jsx', code);
