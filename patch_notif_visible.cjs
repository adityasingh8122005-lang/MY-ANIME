const fs = require('fs');
let code = fs.readFileSync('src/components/Notifications.jsx', 'utf8');

// Remove the early return
code = code.replace(
  '  if (updates.length === 0) return null;',
  ''
);

// Conditionally render the red dot and the content
code = code.replace(
  '<span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border border-dark-surface animate-pulse" />',
  '{updates.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border border-dark-surface animate-pulse" />}'
);

code = code.replace(
  `          <div className="max-h-64 overflow-y-auto">
            {updates.map((u, i) => (`,
  `          <div className="max-h-64 overflow-y-auto">
            {updates.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">No new episodes or seasons right now.</div>
            ) : updates.map((u, i) => (`
);

code = code.replace(
  `              </Link>
            ))}
          </div>`,
  `              </Link>
            ))}
          </div>`
); // Nothing to do here since the ternary is closed in the map... wait!
// The ternary needs a closing parenthesis!

