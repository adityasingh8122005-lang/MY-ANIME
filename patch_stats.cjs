const fs = require('fs');
let code = fs.readFileSync('src/pages/StatisticsPage.jsx', 'utf8');

const oldHtml = `<div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tv size={14} /> Total Episodes
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalEpisodesWatched}</div>
        </div>`;

const newHtml = `<div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tv size={14} /> Total Episodes
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalEpisodesWatched}</div>
          <div className="flex gap-4 text-xs">
            <div className="text-zinc-400">Canon: <span className="text-zinc-200 font-bold">{stats.totalCanonWatched}</span></div>
            <div className="text-zinc-400">Filler: <span className="text-zinc-200 font-bold">{stats.totalFillerWatched}</span></div>
          </div>
        </div>`;

code = code.replace(oldHtml, newHtml);
fs.writeFileSync('src/pages/StatisticsPage.jsx', code);
