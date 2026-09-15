const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.jsx', 'utf8');

code = code.replace(
  'if (window.confirm("Are you sure you want to delete ALL your anime, watch history, and database entries? This cannot be undone!")) {',
  'if (window.confirm("Are you sure you want to remove all the unknown/blank anime that were just imported? Your original anime and watch history will be kept safe!")) {'
);

code = code.replace(
  'await removeUnknownAnime();',
  'const removedCount = await removeUnknownAnime();'
);

code = code.replace(
  'showMessage("All data has been cleared. Your collection is now empty.");',
  'showMessage(`Cleaned up ${removedCount} unknown anime successfully!`);'
);

code = code.replace(
  'Wipe All Data (Reset Application)',
  'Remove Unknown Anime Only'
);

code = code.replace(
  'This will permanently delete all your anime, franchises, and watch history from this device. If you just had unknown anime imported by mistake, this is the easiest way to start fresh.',
  'This will safely remove ONLY the "Unknown" / blank anime that were just imported by the script. Your previously added anime, watch history, and database will remain completely safe.'
);

fs.writeFileSync('src/pages/SettingsPage.jsx', code);
