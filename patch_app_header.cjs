const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Step 1: Remove Notifications from the left div
code = code.replace(
  `<div className="flex items-center gap-4">
              <Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
                MY AN!ME
              </Link>
              <Notifications />
            </div>`,
  `<Link to="/" className="text-xl font-bold tracking-wider text-accent font-mono shrink-0">
              MY AN!ME
            </Link>`
);

// Step 2: Insert Notifications next to the Settings NavItem
code = code.replace(
  `<NavItem to="/settings" icon={SettingsIcon} label="Settings" />
            </nav>`,
  `<NavItem to="/settings" icon={SettingsIcon} label="Settings" />
              <Notifications />
            </nav>`
);

// Also need to make sure the nav container aligns everything properly
// It's a flex container, so <Notifications /> inside will just sit next to the items.
// wait, Notifications is a div with relative positioning, it will align fine.
// But Notifications has p-2 text-zinc-400 hover:text-white. It will look like a nav item.

fs.writeFileSync('src/App.jsx', code);
