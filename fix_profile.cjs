const fs = require('fs');

let code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');

code = code.replace(
  ") : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (",
  `) : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in this category.
        </div>
      ) : (`
);

fs.writeFileSync('src/pages/ProfilePage.jsx', code);
