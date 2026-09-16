const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'className="flex-1 flex items-center justify-end overflow-hidden ml-4"',
  'className="flex-1 flex items-center justify-end min-w-0 ml-4"'
);

fs.writeFileSync('src/App.jsx', code);
