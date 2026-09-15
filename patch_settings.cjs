const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.jsx', 'utf8');

const resetFunction = `
  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to delete ALL your anime, watch history, and database entries? This cannot be undone!")) {
      try {
        await clearAllUserData();
        showMessage("All data has been cleared. Your collection is now empty.");
        // Optional: refresh page after a second
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error(err);
        showMessage("Failed to clear data.", true);
      }
    }
  };
`;

code = code.replace('const handleImportClick = () => {', resetFunction + '\n  const handleImportClick = () => {');

const resetButtonUI = `
      <div className="bg-dark-surface border border-red-900/30 rounded-lg p-6 mt-8">
        <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          This will permanently delete all your anime, franchises, and watch history from this device. If you just had unknown anime imported by mistake, this is the easiest way to start fresh.
        </p>
        <button 
          onClick={handleResetData}
          className="bg-red-950/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-md border border-red-900/50 transition-colors text-sm font-bold"
        >
          Wipe All Data (Reset Application)
        </button>
      </div>
    </div>
  );
}
`;

code = code.replace('    </div>\n  );\n}', resetButtonUI);

fs.writeFileSync('src/pages/SettingsPage.jsx', code);
