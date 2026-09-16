import { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLoginModal } from '../contexts/LoginModalContext';

import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails, getAnimeEpisodes } from '../services/jikanApi';
import { getUserAnime, updateUserAnime, removeUserAnime, addWatchHistory, getWatchHistory, updateWatchHistory, deleteWatchHistory } from '../services/userService';
import { getEpisodeFillerData, getSingleEpisodeFillerStatus, FILLER_STATUS, getAnimeFillerStats } from '../services/fillerApi';
import { getImdbRating } from '../services/imdbApi';
import { getFranchiseData } from '../services/franchiseApi';
import { addFranchiseToDb } from '../services/franchiseService';
import { Loader2, ArrowLeft, ExternalLink, Calendar, History, Trash2, CheckCircle, PlayCircle, List, PauseCircle, XCircle, Plus, Edit2, MessageSquare, Lightbulb } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import CommentsSection from '../components/CommentsSection';
import TheoriesSection from '../components/TheoriesSection';

export default function AnimeDetailsPage() {
  const { session } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [userAnime, setUserAnime] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFranchise, setIsAddingFranchise] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('episodes');

  const handleAddFranchise = async () => {
    setIsAddingFranchise(true);
    try {
      const franchiseData = await getFranchiseData(id);
      if (franchiseData) {
        await addFranchiseToDb(franchiseData);
        // Refresh local state
        const local = await getUserAnime(id);
        setUserAnime(local);
      } else {
        // Fallback to basic if franchise fails
        const added = await updateUserAnime(id, { personalStatus: 'Plan to Watch' });
        setUserAnime(added);
      }
    } catch (err) {
      console.error(err);
    }
    setIsAddingFranchise(false);
  };

  // History form state
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyEps, setHistoryEps] = useState(1);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editHistoryDate, setEditHistoryDate] = useState('');
  const [editHistoryEps, setEditHistoryEps] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // External modular data
  const [imdbScore, setImdbScore] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [fillerData, setFillerData] = useState(null);
  const [fillerStats, setFillerStats] = useState(null);
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

        // Fetch filler stats
        getAnimeFillerStats(metadata.title, metadata.englishTitle).then(stats => {
          setFillerStats(stats);
        }).catch(() => null);

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
    const updates = { personalStatus: status };
    
    // Automatically maximize progress if marked as Completed
    const safeAnimeEps = (anime.episodes === 1 && anime.status === "Unknown") ? null : anime.episodes;
    const maxEps = safeAnimeEps || fillerStats?.total || null;
    if (status === 'Completed' && maxEps) {
      updates.episodesWatched = maxEps;
    }
    
    const updated = await updateUserAnime(id, updates);
    setUserAnime(updated);
  };

  const handleEpisodesChange = async (eps) => {
    const safeAnimeEps = (anime.episodes === 1 && anime.status === "Unknown") ? null : anime.episodes;
    const maxEps = safeAnimeEps || fillerStats?.total || null;
    let newValue = parseInt(eps, 10);
    if (isNaN(newValue)) return;
    if (newValue < 0) newValue = 0;
    if (maxEps && newValue > maxEps) newValue = maxEps;
    
    const updated = await updateUserAnime(id, { episodesWatched: newValue });
    setUserAnime(updated);
  };

  const handleRatingChange = async (rating) => {
    if (!session) { openLoginModal(); return; }
    let newValue = parseInt(rating, 10);
    if (isNaN(newValue)) newValue = null;
    else if (newValue < 1) newValue = 1;
    else if (newValue > 10) newValue = 10;
    
    const updated = await updateUserAnime(id, { personalRating: newValue });
    setUserAnime(updated);
  };

  const handleRemove = () => {
    if (!session) { openLoginModal(); return; }
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Anime',
      message: 'Are you sure you want to remove this anime from your collection? This action cannot be undone.',
      onConfirm: async () => {
        await removeUserAnime(id);
        setUserAnime(null);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleAddHistory = async (e) => {
    e.preventDefault();
    if (!session) { openLoginModal(); return; }
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

  const handleDeleteHistory = (entryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Session',
      message: 'Are you sure you want to delete this watch session?',
      onConfirm: async () => {
        await deleteWatchHistory(entryId);
        setHistory(await getWatchHistory(id));
        setConfirmDialog({ isOpen: false });
      }
    });
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
  // Fix for the old franchise Add bug which hardcoded episodes to 1 and status to Unknown
  const safeAnimeEps = (anime.episodes === 1 && anime.status === "Unknown") ? null : anime.episodes;
  const displayEpisodes = safeAnimeEps || fillerStats?.total || null;
  const isCaughtUp = displayEpisodes && userAnime?.episodesWatched === displayEpisodes && anime.status !== "Finished Airing";
  const isFinished = displayEpisodes && userAnime?.episodesWatched === displayEpisodes && anime.status === "Finished Airing";

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
            {(!userAnime || !userAnime.franchiseId) && (
              <button 
                onClick={handleAddFranchise}
                disabled={isAddingFranchise}
                className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-accent/50 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-accent/20 border border-accent"
              >
                {isAddingFranchise ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                {isAddingFranchise ? 'Building Franchise...' : 'Add Entire Franchise'}
              </button>
            )}

            {userAnime ? (
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
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      max={displayEpisodes || ''}
                      value={userAnime.episodesWatched || 0}
                      onChange={(e) => handleEpisodesChange(e.target.value)}
                      className="w-16 bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none text-center"
                    />
                  </div>
                    <span className="text-zinc-400 font-medium text-sm mt-0.5">/ {displayEpisodes || '?'} eps</span>
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
            ) : null}

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
              <span className="text-sm font-medium text-white">{displayEpisodes || '?'}</span>
            </div>
            <div className="flex flex-col border border-zinc-800 rounded bg-dark-surface p-3 min-w-[100px] items-center">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Season</span>
              <span className="text-sm font-medium text-white capitalize">{anime.season ? `${anime.season} ${anime.year}` : 'Unknown'}</span>
            </div>
          </div>

          {/* Synopsis removed as requested */}

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

          {fillerStats && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3 border-b border-zinc-800 pb-2 flex items-center justify-between">
                Filler Statistics
                <a href={`https://www.animefillerlist.com/shows/${(anime.englishTitle || anime.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-normal text-accent hover:underline flex items-center gap-1">
                  View Source <ExternalLink size={12} />
                </a>
              </h3>
              <div className="bg-dark-surface border border-zinc-800 rounded-lg p-4 flex gap-4 text-center divide-x divide-zinc-800">
                <div className="flex-1 flex flex-col items-center">
                   <span className="text-2xl font-bold text-green-400">{fillerStats.canon}</span>
                   <span className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-wider">Canon</span>
                </div>
                {fillerStats.mixed > 0 && (
                  <div className="flex-1 flex flex-col items-center">
                     <span className="text-2xl font-bold text-yellow-400">{fillerStats.mixed}</span>
                     <span className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-wider">Mixed</span>
                  </div>
                )}
                <div className="flex-1 flex flex-col items-center">
                   <span className="text-2xl font-bold text-red-400">{fillerStats.filler}</span>
                   <span className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-wider">Filler</span>
                </div>
                <div className="flex-1 flex flex-col items-center bg-zinc-900/50 rounded -my-2 py-2">
                   <span className="text-2xl font-bold text-white">{fillerStats.fillerPercentage}%</span>
                   <span className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-wider">Filler %</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Section */}
          <div className="mb-8">
            <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('episodes')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors \${activeTab === 'episodes' ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-2"><List size={16} /> Episodes</div>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors \${activeTab === 'comments' ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-2"><MessageSquare size={16} /> Comments</div>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors \${activeTab === 'chat' ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-2"><MessageSquare size={16} /> Live Chat</div>
              </button>
              {(anime.status === 'Currently Airing' || anime.status === 'Not yet aired') && (
                <button
                  onClick={() => setActiveTab('theories')}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors \${activeTab === 'theories' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2"><Lightbulb size={16} /> Theories</div>
                </button>
              )}
            </div>

            {activeTab === 'episodes' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-4 gap-2">
                  <div className="flex flex-wrap gap-2">
                    {['All', FILLER_STATUS.CANON, FILLER_STATUS.FILLER, FILLER_STATUS.MIXED, FILLER_STATUS.UNKNOWN].map(filter => (
                      <button 
                        key={filter}
                        onClick={() => setEpisodeFilter(filter)}
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded border transition-colors \${episodeFilter === filter ? 'bg-accent/20 border-accent text-accent' : 'bg-dark-surface border-zinc-700 text-zinc-400 hover:text-white'}`}
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
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 self-start sm:self-auto \${
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
            )}

            {activeTab === 'comments' && (
              <CommentsSection malId={anime.mal_id} />
            )}

            {activeTab === 'chat' && (
              <ChatBox malId={anime.mal_id} />
            )}

            {activeTab === 'theories' && (
              <TheoriesSection malId={anime.mal_id} />
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
      {/* Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-elevated border border-zinc-700 rounded-lg max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-zinc-400 text-sm mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
