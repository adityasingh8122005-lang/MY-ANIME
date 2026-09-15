const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  `<Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
              MY AN!ME
            </Link>
            <Notifications />`,
  `<div className="flex items-center gap-4">
              <Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
                MY AN!ME
              </Link>
              <Notifications />
            </div>`
);

fs.writeFileSync('src/App.jsx', code);
