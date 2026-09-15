const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.jsx', 'utf8');

code = code.replace(
  'if (window.confirm("Are you sure you want to remove all the unknown/blank anime that were just imported? Your original anime and watch history will be kept safe!")) {',
  'if (window.confirm("Are you sure you want to delete ALL your anime, watch history, and database entries? This cannot be undone!")) {'
);

code = code.replace(
  'const removedCount = await removeUnknownAnime();\n        showMessage(`Cleaned up ${removedCount} unknown anime successfully!`);',
  'await clearAllUserData();\n        showMessage("All data has been cleared. Your collection is now empty.");'
);

code = code.replace(
  'Remove Unknown Anime Only',
  'Wipe All Data (Reset Application)'
);

code = code.replace(
  'This will safely remove ONLY the "Unknown" / blank anime that were just imported by the script. Your previously added anime, watch history, and database will remain completely safe.',
  'This will permanently delete all your anime, franchises, and watch history from this device. This is the easiest way to start fresh.'
);

code = code.replace(
  'import { exportUserData, importUserData, removeUnknownAnime } from \'../services/userService\';',
  'import { exportUserData, importUserData, clearAllUserData } from \'../services/userService\';'
);

fs.writeFileSync('src/pages/SettingsPage.jsx', code);
