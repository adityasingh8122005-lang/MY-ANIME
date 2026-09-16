const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "{profile?.role === 'admin' && (",
  "{(session?.user?.email === 'iamaditya8090@gmail.com' || session?.user?.email === 'adityasingh8122005@gmail.com') && ("
);

fs.writeFileSync('src/App.jsx', code);
