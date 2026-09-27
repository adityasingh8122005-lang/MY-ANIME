const fs = require('fs');

let code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');

const badBlock = `      ) : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in this category.
        </div>
      ) : (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in their collection yet.
        </div>
      ) : (`;

const goodBlock = `      ) : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in this category.
        </div>
      ) : (`;

code = code.replace(badBlock, goodBlock);
fs.writeFileSync('src/pages/ProfilePage.jsx', code);
