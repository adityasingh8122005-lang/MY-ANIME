const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

const oldHeader = `<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Library className="text-accent" /> My Anime Collection
        </h1>`;
        
const newHeader = `<div className="pt-12 pb-8 mb-8 border-b border-white/10">
        <h1 className="text-h1 sm:text-display-m font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          YOUR COLLECTION
        </h1>
        <div className="flex flex-wrap items-center gap-6">
           <div className="flex flex-col">
              <span className="text-h3 font-bold text-primary">{collection.length}</span>
              <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Total Anime</span>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-h3 font-bold text-success">{collection.filter(c => c.personalStatus === 'Completed' || c.episodesWatched === c.episodes).length}</span>
              <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-h3 font-bold text-warning">{collection.filter(c => c.personalStatus === 'Watching').length}</span>
              <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Watching</span>
           </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div /> {/* Spacer for layout flex */}`;
        
code = code.replace(oldHeader, newHeader);

// Let's also upgrade the tabs (Status Navigation)
const oldTabs = `<div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 border-b border-zinc-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors border-b-2",
              activeTab === tab ? "text-accent border-accent" : "text-zinc-500 border-transparent hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>`;

const newTabs = `<div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeTab === tab ? "bg-primary text-white shadow-depth-2" : "bg-surface-2 text-zinc-400 hover:text-white hover:bg-surface-3 border border-white/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>`;
      
code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);
