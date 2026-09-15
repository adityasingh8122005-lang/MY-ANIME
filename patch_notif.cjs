const fs = require('fs');
let code = fs.readFileSync('src/components/Notifications.jsx', 'utf8');

code = code.replace(
  '<div className="relative">',
  '<div className="relative flex items-center">'
);

fs.writeFileSync('src/components/Notifications.jsx', code);
