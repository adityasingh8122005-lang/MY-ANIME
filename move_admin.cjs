const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove Admin from NavItem list
code = code.replace('<NavItem to="/admin" icon={ShieldAlert} label="Admin" />', '');

// Add Admin to HeaderProfile dropdown, right below Settings
const dropdownAdmin = `
          <Link 
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <SettingsIcon size={16} /> Settings
          </Link>
          {profile?.role === 'admin' && (
            <Link 
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-accent hover:bg-zinc-800 hover:text-accent transition-colors"
            >
              <ShieldAlert size={16} /> Admin Panel
            </Link>
          )}
`;

code = code.replace(
  `          <Link \n            to="/settings"\n            onClick={() => setIsOpen(false)}\n            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"\n          >\n            <SettingsIcon size={16} /> Settings\n          </Link>`,
  dropdownAdmin
);

fs.writeFileSync('src/App.jsx', code);
