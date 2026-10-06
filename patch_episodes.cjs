const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

const oldEpisode = `<div key={ep.mal_id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-dark-surface border border-zinc-800 p-3 rounded text-sm hover:border-zinc-700 transition-colors gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-zinc-500 font-mono w-10 shrink-0">E{ep.mal_id}</span>
                          <span className="text-white font-medium truncate" title={ep.title || \`Episode \${ep.mal_id}\`}>{ep.title || \`Episode \${ep.mal_id}\`}</span>
                        </div>
                        <span className={\`text-micro font-bold uppercase px-2 py-1 rounded shrink-0 self-start sm:self-auto \\\${
                          ep.fillerStatus === FILLER_STATUS.FILLER ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          ep.fillerStatus === FILLER_STATUS.CANON ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          ep.fillerStatus === FILLER_STATUS.MIXED ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }\`}>
                          {ep.fillerStatus}
                        </span>
                      </div>`;

const newEpisode = `                      <div key={ep.mal_id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-2 hover:bg-surface-3 border border-white/5 p-3 rounded-lg text-sm transition-all duration-300 gap-3 group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="text-zinc-500 font-mono w-8 shrink-0 text-right group-hover:text-primary transition-colors">{String(ep.mal_id).padStart(2, '0')}</span>
                          <div className="flex flex-col flex-1 min-w-0">
                             <span className={\`font-medium truncate transition-colors \${userAnime && userAnime.episodesWatched >= ep.mal_id ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-white'}\`} title={ep.title || \`Episode \${ep.mal_id}\`}>
                               {ep.title || \`Episode \${ep.mal_id}\`}
                             </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                          <span className={\`text-micro font-bold uppercase px-2 py-1 rounded \${
                            ep.fillerStatus === FILLER_STATUS.FILLER ? 'bg-error/10 text-error border border-error/20' :
                            ep.fillerStatus === FILLER_STATUS.CANON ? 'bg-success/10 text-success border border-success/20' :
                            ep.fillerStatus === FILLER_STATUS.MIXED ? 'bg-warning/10 text-warning border border-warning/20' :
                            'bg-surface-3 text-zinc-400 border border-white/10'
                          }\`}>
                            {ep.fillerStatus}
                          </span>
                          {userAnime && userAnime.episodesWatched >= ep.mal_id && (
                             <CheckCircle size={16} className="text-success" />
                          )}
                          {userAnime && userAnime.episodesWatched < ep.mal_id && (
                             <div className="w-4 h-4 rounded-full border-2 border-zinc-600 group-hover:border-primary transition-colors" />
                          )}
                        </div>
                      </div>`;
                      
code = code.replace(oldEpisode, newEpisode);
fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
