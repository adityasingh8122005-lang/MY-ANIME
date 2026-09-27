const fs = require('fs');

let code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');

// 1. Import Tv icon
code = code.replace(
  "import { UserCircle, Calendar, ShieldAlert } from 'lucide-react';",
  "import { UserCircle, Calendar, ShieldAlert, Tv } from 'lucide-react';"
);

// 2. Add state for activeTab
code = code.replace(
  "const [error, setError] = useState(null);",
  "const [error, setError] = useState(null);\n  const [activeTab, setActiveTab] = useState('All');"
);

// 3. Add Watched Anime stat in header
code = code.replace(
  '<span className="flex items-center gap-1"><Calendar size={16} /> Joined {new Date(profile.created_at).toLocaleDateString()}</span>',
  `<span className="flex items-center gap-1"><Calendar size={16} /> Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Tv size={16} /> {collection.filter(a => a.personalStatus === 'Completed' || a.personalStatus === 'Watching').length} Watched Anime</span>`
);

// 4. Add Tabs to Collection Section
const tabsUI = `
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-white">Anime Collection</h2>
        {collection.length > 0 && (!profile.is_public ? session?.user?.id === profile.id : true) && (
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0">
            {['All', 'Watching', 'Completed', 'Plan to Watch'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors \${activeTab === tab ? 'bg-accent text-white' : 'bg-dark-surface border border-zinc-800 text-zinc-400 hover:border-zinc-500'}\`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
`;

code = code.replace(
  '<h2 className="text-xl font-bold text-white mb-4">Anime Collection</h2>',
  tabsUI
);

// 5. Filter the collection before mapping
code = code.replace(
  'collection.map(anime => (',
  `(activeTab === 'All' ? collection : collection.filter(a => a.personalStatus === activeTab)).map(anime => (`
);

// 6. Handle empty state for specific tabs
code = code.replace(
  ') : collection.length === 0 ? (',
  `) : collection.length === 0 ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in their collection yet.
        </div>
      ) : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (`
);


fs.writeFileSync('src/pages/ProfilePage.jsx', code);
