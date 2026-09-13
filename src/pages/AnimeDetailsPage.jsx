import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails, getAnimeEpisodes } from '../services/jikanApi';
import { getUserAnime, updateUserAnime, removeUserAnime, addWatchHistory, getWatchHistory, updateWatchHistory, deleteWatchHistory } from '../services/userService';
import { getEpisodeFillerData, getSingleEpisodeFillerStatus, FILLER_STATUS } from '../services/fillerApi';
import { getImdbRating } from '../services/imdbApi';
import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2 } from 'lucide-react';

export default function AnimeDetailsPage() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [userAnime, setUserAnime] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // History form state
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyEps, setHistoryEps] = useState(1);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editHistoryDate, setEditHistoryDate] = useState('');
  const [editHistoryEps, setEditHistoryEps] = useState(1);

  // External modular data
  const [imdbScore, setImdbScore] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [fillerData, setFillerData] = useState(null);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState('All');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [metadata, userData, historyData, imdb] = await Promise.all([
          getAnimeDetails(id),
          getUserAnime(id),
          getWatchHistory(id),
          getImdbRating(id).catch(() => null)
        ]);
        setAnime(metadata);
        setUserAnime(userData);
        setHistory(historyData);
        setImdbScore(imdb);

        // Fetch episodes in background so it doesn't block main render
        setEpisodesLoading(true);
        Promise.all([
          getAnimeEpisodes(id).catch(() => []),
          getEpisodeFillerData(id).catch(() => null)
        ]).then(([eps, filler]) => {
          setEpisodesList(eps || []);
          setFillerData(filler);
          setEpisodesLoading(false);
        });

      } catch (err) {
        setError('Failed to load anime details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusChange = async (status) => {
    const updated = await updateUserAnime(id, { personalStatus: status });
    setUserAnime(updated);
  };

  const handleEpisodesChange = async (eps) => {
    const maxEps = anime.episodes;
    let newValue = parseInt(eps, 10);
    if (isNaN(newValue)) return;
    if (newValue < 0) newValue = 0;
    if (maxEps && newValue > maxEps) newValue = maxEps;
    
    const updated = await updateUserAnime(id, { episodesWatched: newValue });
    setUserAnime(updated);
  };

  const handleRatingChange = async (rating) => {
    let newValue = parseInt(rating, 10);
    if (isNaN(newValue)) newValue = null;
    else if (newValue < 1) newValue = 1;
    else if (newValue > 10) newValue = 10;
    
    const updated = await updateUserAnime(id, { personalRating: newValue });
    setUserAnime(updated);
  };

  const handleRemove = async () => {
    if (window.confirm("Remove this anime from your collection?")) {
      await removeUserAnime(id);
      setUserAnime(null);
    }
  };

  const handleAddHistory = async (e) => {
    e.preventDefault();
    if (!historyDate || historyEps < 1) return;
    
    await addWatchHistory(id, historyDate, historyEps);
    const updatedHistory = await getWatchHistory(id);
    setHistory(updatedHistory);
    
    // Auto increment progress too if user wants (optional, but let's just do it to be helpful)
    if (userAnime) {
      await handleEpisodesChange((userAnime.episodesWatched || 0) + parseInt(historyEps, 10));
    }
    
    setHistoryEps(1);
  };

  const handleEditHistoryStart = (entry) => {
    setEditingHistoryId(entry.id);
    setEditHistoryDate(entry.date);
    setEditHistoryEps(entry.episodesWatched);
  };

  const handleEditHistoryCancel = () => {
    setEditingHistoryId(null);
  };

  const handleEditHistorySave = async (entryId) => {
    await updateWatchHistory(entryId, editHistoryDate, editHistoryEps);
    setHistory(await getWatchHistory(id));
    setEditingHistoryId(null);
  };

  const handleDeleteHistory = async (entryId) => {
    if (window.confirm("Delete this watch session?")) {
      await deleteWatchHistory(entryId);
      setHistory(await getWatchHistory(id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Anime not found.'}</p>
        <Link to="/search" className="text-accent hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Back to Search
        </Link>
      </div>
    );
  }

  // Calculate if caught up
  const isCaughtUp = anime.episodes && userAnime?.episodesWatched === anime.episodes && anime.status !== "Finished Airing";
  const isFinished = anime.episodes && userAnime?.episodesWatched === anime.episodes && anime.status === "Finished Airing";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link to="/search" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Search
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Poster & Actions */}
        <div className="w-full md:w-72 shrink-0">
          <div className="rounded-lg overflow-hidden border border-zinc-800 bg-dark-surface shadow-lg">
            {anime.poster ? (
              <img src={anime.poster} alt={anime.title} className="w-full object-cover aspect-[2/3]" />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center text-zinc-600 bg-zinc-900">No Image</div>
            )}
          </div>
          
          <div className="mt-4 flex flex-col gap-3">
            {!userAnime ? (
              <button 
                onClick={() => handleStatusChange('Plan to Watch')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-semibold"
              >
                <Plus size={18} /> Add to My Anime
              </button>
            ) : (
              <div className="bg-dark-surface border border-zinc-800 rounded-lg p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase mb-1 block">Status</label>
                  <select 
                    value={userAnime.personalStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none"
                  >
                    <option>Plan to Watch</option>
                    <option>Watching</option>
                    <option>Completed</option>
                    <option>On Hold</option>
                    <option>Dropped</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase mb-1 flex justify-between">
                    <span>Progress</span>
                    {isCaughtUp && <span className="text-accent text-[10px]">CAUGHT UP</span>}
                    {isFinished && <span className="text-green-500 text-[10px]">COMPLETED</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      max={anime.episodes || ''}
                      value={userAnime.episodesWatched || 0}
                      onChange={(e) => handleEpisodesChange(e.target.value)}
                      className="w-16 bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none text-center"
                    />
                    <span className="text-zinc-400">/ {anime.episodes || '?'}</span>
                    <button 
                      onClick={() => handleEpisodesChange((userAnime.episodesWatched || 0) + 1)}
                      disabled={anime.episodes && userAnime.episodesWatched >= anime.episodes}
                      className="ml-auto p-2 bg-dark-elevated hover:bg-zinc-700 rounded border border-zinc-700 disabled:opacity-50 transition-colors text-white"
                      title="Increment Episode"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase mb-1 block">My Rating</label>
                  <select 
                    value={userAnime.personalRating || ''}
                    onChange={(e) => handleRatingChange(e.target.value)}
                    className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="">Not Rated</option>
                    {[10,9,8,7,6,5,4,3,2,1].map(num => (
                      <option key={num} value={num}>⭐ {num}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleRemove}
                  className="mt-2 flex items-center justify-center gap-2 w-full py-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded transition-colors text-sm border border-transparent hover:border-red-900/50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}

            <a 
              href={anime.malUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-dark-elevated hover:bg-zinc-700 text-white rounded border border-zinc-700 transition-colors mt-2"
            >
              MyAnimeList <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">{anime.title}</h1>
          {anime.japaneseTitle && (
            <h2 className="text-xl text-zinc-400 mb-6 font-medium">{anime.japaneseTitle}</h2>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            {imdbScore !== null && (
              <div className="flex flex-col border border-zinc-800 rounded bg-dark-surface p-3 min-w-[100px] items-center">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">IMDb</span>
                <span className="text-xl font-bold text-white flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span> {imdbScore}
                </span>
              </div>
            )}
            {userAnime?.personalRating && (
              <div className="flex flex-col border border-accent/30 rounded bg-accent/10 p-3 min-w-[100px] items-center">
                <span className="text-xs text-accent uppercase font-bold tracking-wider mb-1">My Rating</span>
                <span className="text-xl font-bold text-white flex items-center gap-1">
                  <span className="text-accent">⭐</span> {userAnime.personalRating}
                </span>
              </div>
            )}
            <div className="flex flex-col border border-zinc-800 rounded bg-dark-surface p-3 min-w-[100px] items-center">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</span>
              <span className="text-sm font-medium text-white text-center">{anime.status || 'Unknown'}</span>
            </div>
            <div className="flex flex-col border border-zinc-800 rounded bg-dark-surface p-3 min-w-[100px] items-center">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Episodes</span>
              <span className="text-sm font-medium text-white">{anime.episodes || '?'}</span>
            </div>
            <div className="flex flex-col border border-zinc-800 rounded bg-dark-surface p-3 min-w-[100px] items-center">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Season</span>
              <span className="text-sm font-medium text-white capitalize">{anime.season ? `${anime.season} ${anime.year}` : 'Unknown'}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-zinc-800 pb-2">Synopsis</h3>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
              {anime.synopsis || 'No synopsis available.'}
            </p>
          </div>

          {(anime.genres?.length > 0 || anime.themes?.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3 border-b border-zinc-800 pb-2">Information</h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres?.map(genre => (
                  <span key={genre} className="px-3 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-full border border-zinc-700">
                    {genre}
                  </span>
                ))}
                {anime.themes?.map(theme => (
                  <span key={theme} className="px-3 py-1 bg-dark-elevated text-zinc-400 text-xs rounded-full border border-zinc-800">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {anime.alternativeTitles?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3 border-b border-zinc-800 pb-2">Alternative Titles</h3>
              <ul className="list-disc list-inside text-sm text-zinc-400">
                {anime.alternativeTitles.map((title, i) => (
                  <li key={i}>{title}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Episode List */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-zinc-800 pb-2 gap-2">
              <h3 className="text-lg font-semibold text-white">Episodes</h3>
              
              <div className="flex flex-wrap gap-2">
                {['All', FILLER_STATUS.CANON, FILLER_STATUS.FILLER, FILLER_STATUS.MIXED, FILLER_STATUS.UNKNOWN].map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setEpisodeFilter(filter)}
                    className={`text-[10px] sm:text-xs px-2 py-1 rounded border transition-colors ${episodeFilter === filter ? 'bg-accent/20 border-accent text-accent' : 'bg-dark-surface border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            {episodesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-accent" />
              </div>
            ) : episodesList.length === 0 ? (
              <p className="text-sm text-zinc-500 bg-dark-surface p-4 rounded text-center border border-zinc-800">No episode list data available from the source.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                {episodesList
                  .map(ep => {
                    const status = getSingleEpisodeFillerStatus(fillerData, ep.mal_id);
                    return { ...ep, fillerStatus: status };
                  })
                  .filter(ep => episodeFilter === 'All' || ep.fillerStatus === episodeFilter)
                  .map(ep => (
                  <div key={ep.mal_id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-dark-surface border border-zinc-800 p-3 rounded text-sm hover:border-zinc-700 transition-colors gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-zinc-500 font-mono w-10 shrink-0">E{ep.mal_id}</span>
                      <span className="text-white font-medium truncate" title={ep.title || `Episode ${ep.mal_id}`}>{ep.title || `Episode ${ep.mal_id}`}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 self-start sm:self-auto ${
                      ep.fillerStatus === FILLER_STATUS.FILLER ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      ep.fillerStatus === FILLER_STATUS.CANON ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      ep.fillerStatus === FILLER_STATUS.MIXED ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {ep.fillerStatus}
                    </span>
                  </div>
                ))}
                {episodesList.filter(ep => episodeFilter === 'All' || getSingleEpisodeFillerStatus(fillerData, ep.mal_id) === episodeFilter).length === 0 && (
                   <p className="text-sm text-zinc-500 text-center py-4">No episodes match this filter.</p>
                )}
              </div>
            )}
          </div>

          {userAnime && (
            <div className="mt-8 border-t border-zinc-800 pt-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <History className="text-accent" /> Watch History
              </h3>
              
              <form onSubmit={handleAddHistory} className="flex flex-wrap gap-4 items-end bg-dark-surface p-4 rounded-lg border border-zinc-800 mb-6">
                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase mb-1 block">Date</label>
                  <input 
                    type="date" 
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    required
                    className="bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase mb-1 block">Episodes Watched</label>
                  <input 
                    type="number" 
                    min="1"
                    value={historyEps}
                    onChange={e => setHistoryEps(e.target.value)}
                    required
                    className="w-24 bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-dark-elevated hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Log Session
                </button>
              </form>

              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-dark-surface border border-zinc-800 p-3 rounded text-sm group">
                      {editingHistoryId === entry.id ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <input 
                            type="date" 
                            value={editHistoryDate}
                            onChange={e => setEditHistoryDate(e.target.value)}
                            className="bg-dark-base border border-zinc-700 rounded p-1 text-white text-xs focus:border-accent focus:outline-none"
                          />
                          <input 
                            type="number" 
                            min="1"
                            value={editHistoryEps}
                            onChange={e => setEditHistoryEps(e.target.value)}
                            className="w-16 bg-dark-base border border-zinc-700 rounded p-1 text-white text-xs focus:border-accent focus:outline-none"
                          />
                          <div className="flex gap-2 ml-auto">
                            <button onClick={() => handleEditHistorySave(entry.id)} className="text-green-400 hover:text-green-300">Save</button>
                            <button onClick={handleEditHistoryCancel} className="text-zinc-400 hover:text-zinc-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 text-zinc-300">
                            <Calendar size={14} className="text-zinc-500" />
                            {entry.date}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="font-medium text-white">
                              <span className="text-accent">+{entry.episodesWatched}</span> ep{entry.episodesWatched > 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditHistoryStart(entry)} className="text-zinc-400 hover:text-white" title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteHistory(entry.id)} className="text-zinc-400 hover:text-red-400" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No watch history recorded yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
