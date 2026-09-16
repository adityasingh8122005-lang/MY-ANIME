const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "{profile?.role === 'admin' && (\n        \n      )}",
  ""
);

fs.writeFileSync('src/App.jsx', code);
