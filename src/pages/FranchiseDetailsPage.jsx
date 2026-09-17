import { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLoginModal } from '../contexts/LoginModalContext';

import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFranchiseWithProgress } from '../services/franchiseService';
import { updateUserAnime } from '../services/userService';
import { Loader2, ArrowLeft, Folder, Tv, Film, CheckCircle } from 'lucide-react';

export default function FranchiseDetailsPage() {
  const { session } = useAuth();
  const [showMovies, setShowMovies] = useState(false);
  const { openLoginModal } = useLoginModal();
  const { id } = useParams();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteFranchise = async () => {
    setIsCompleting(true);
    try {
      for (const season of franchise.seasons) {
        await updateUserAnime(season.malId, { 
          episodesWatched: season.canonEpisodes || season.episodes || 1,
          personalStatus: 'Completed' 
        });
      }
      const data = await getFranchiseWithProgress(id);
      setFranchise(data);
    } catch (err) {
      console.error(err);
    }
    setIsCompleting(false);
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await getFranchiseWithProgress(id);
      setFranchise(data);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Franchise not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 mb-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <img src={franchise.poster} alt={franchise.franchiseName} className="w-32 h-48 object-cover rounded shadow-lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20 flex items-center gap-1">
              <Folder size={10} /> FRANCHISE
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{franchise.franchiseName}</h1>
          
                    <div className="flex flex-wrap gap-4">
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Total Canon</div>
              <div className="text-xl font-bold text-white">{franchise.totalCanon} Eps</div>
            </div>
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Watched</div>
              <div className="text-xl font-bold text-accent">{franchise.totalWatched} Eps</div>
            </div>
            <div className="bg-dark-base border border-zinc-700 rounded p-3 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Progress</div>
              <div className="text-xl font-bold text-white">
                {franchise.totalCanon > 0 ? Math.round((franchise.totalWatched / franchise.totalCanon) * 100) : 0}%
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={handleCompleteFranchise}
              disabled={isCompleting || franchise.totalWatched === franchise.totalCanon}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm border border-zinc-700"
            >
              {isCompleting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} className={franchise.totalWatched === franchise.totalCanon ? "text-green-500" : "text-zinc-400"} />}
              {franchise.totalWatched === franchise.totalCanon ? "Completed" : "Mark Franchise Completed"}
            </button>
          </div>
        </div>
      </div>

            <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Franchise Contents</h2>
        
        {franchise.seasons.some(s => s.format === 'MOVIE') && (
          <label className="flex items-center gap-2 cursor-pointer group bg-dark-surface px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors">
            <input 
              type="checkbox" 
              checked={showMovies}
              onChange={(e) => setShowMovies(e.target.checked)}
              className="accent-accent w-3.5 h-3.5"
            />
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Show Movies</span>
          </label>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {franchise.seasons.filter(season => {
          if (season.format === 'MOVIE') {
            return showMovies;
          }
          return true;
        }).map(season => {
          let dateStr = null;
          if (season.startDate?.year) {
            dateStr = `${season.startDate.year}`;
            if (season.startDate.month) {
              const d = new Date(season.startDate.year, season.startDate.month - 1, season.startDate.day || 1);
              dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              if (season.startDate.day) {
                dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              }
            }
          }
          return (
          <Link 
            key={season.malId} 
            to={`/anime/${season.malId}`}
            className="flex items-center gap-4 bg-dark-surface hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-4 rounded-lg transition-colors group"
          >
            {season.format === 'TV' ? <Tv className="text-zinc-500 group-hover:text-accent" size={24} /> : <Film className="text-zinc-500 group-hover:text-accent" size={24} />}
            <div className="flex-1">
              <h3 className="font-bold text-zinc-200 group-hover:text-white">{season.title}</h3>
              <div className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
                <span>{season.format}</span>
                {dateStr && (
                  <>
                    <span>•</span>
                    <span>{dateStr}</span>
                  </>
                )}
                
                <span>•</span>
                <span>{season.format === 'MOVIE' && season.movieCanonStatus !== 'CANON' ? 0 : (season.canonEpisodes || season.episodes || 1)} Canon Episodes</span>
              </div>
            </div>
            <div className="text-sm font-medium text-zinc-300">
              {season.episodesWatched} / {season.canonEpisodes}
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}
