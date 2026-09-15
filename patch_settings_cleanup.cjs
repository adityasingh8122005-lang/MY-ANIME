const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.jsx', 'utf8');

// Remove clearAllUserData
code = code.replace(', clearAllUserData', '');

// Remove handleResetData block
code = code.replace(/  const handleResetData = async \(\) => \{[\s\S]*?  \};\n\n/, '');

fs.writeFileSync('src/pages/SettingsPage.jsx', code);
