const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  '        <NavItem to="/surprise-me" icon={Dices} label="Surprise Me" />\n',
  ''
);

fs.writeFileSync('src/App.jsx', code);
