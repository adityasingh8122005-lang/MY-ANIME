import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Heart, Compass, Plus, ArrowRight, Dices, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { generateRecommendation } from '../services/recommendation/recommendationService';
import { getFranchiseData } from '../services/franchiseApi';
import { addFranchiseToDb } from '../services/franchiseService';
import { getUserAnime } from '../services/userService';

export default function SurpriseMePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [hasCollection, setHasCollection] = useState(false);

  // Check if they have anything in collection
  useEffect(() => {
    const checkCollection = async () => {
       try {
          const mod = await import('../services/intelligence/intelligenceService');
          const int = await mod.getIntelligenceData();
          setHasCollection(int.totalAnime > 0);
       } catch (e) {
          console.error(e);
       }
    };
    checkCollection();
  }, []);

  const handleDiscover = async (selectedMode) => {
    setMode(selectedMode);
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setAddSuccess(false);

    try {
      const rec = await generateRecommendation(selectedMode);
      
      // Check if it's already in collection (should be excluded by service, but safety check for local status)
      const local = await getUserAnime(rec.anime.idMal);
      if (local && local.status) {
         setAddSuccess(true);
      }
      
      // Simulate cinematic transition delay if not reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
         await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setResult(rec);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate recommendation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdd = async () => {
     if (!result || !result.anime || !result.anime.idMal) return;
     setIsAdding(true);
     try {
         const franchiseData = await getFranchiseData(result.anime.idMal);
         if (franchiseData) {
             await addFranchiseToDb(franchiseData);
             setAddSuccess(true);
         }
     } catch (e) {
         console.error(e);
     } finally {
         setIsAdding(false);
     }
  };

  // 1. Hero / Selection State
  if (!isGenerating && !result && !error) {
    return (
      <div className="max-w-4xl mx-auto pt-20 pb-32 text-center px-4">
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <h1 className="text-display-l font-bold text-white mb-6">What should I watch?</h1>
           {!hasCollection ? (
             <p className="text-body-l text-zinc-400 max-w-xl mx-auto">
                Your Anime Universe is still empty. Try a random discovery below, or add some anime to your collection to unlock personalized recommendations.
             </p>
           ) : (
             <p className="text-body-l text-zinc-400 max-w-xl mx-auto">
                Let MY AN!ME analyze your taste profile and find the perfect next series.
             </p>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
           
           <button onClick={() => handleDiscover('Taste')} disabled={!hasCollection} className="group relative bg-surface-1 hover:bg-surface-2 border border-white/5 hover:border-primary/30 rounded-[24px] p-8 text-left transition-all duration-300 shadow-depth-2 hover:shadow-depth-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Heart size={24} />
              </div>
              <h3 className="text-h4 font-bold text-white mb-2">Based On My Taste</h3>
              <p className="text-sm text-zinc-500">Strongly weighted toward your Anime DNA and highly rated genres.</p>
              {!hasCollection && <div className="absolute inset-0 flex items-center justify-center bg-void/80 rounded-[24px] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-xs font-bold text-white bg-surface-3 px-3 py-1 rounded-full">Requires Collection Data</span></div>}
           </button>

           <button onClick={() => handleDiscover('Different')} disabled={!hasCollection} className="group relative bg-surface-1 hover:bg-surface-2 border border-white/5 hover:border-warning/30 rounded-[24px] p-8 text-left transition-all duration-300 shadow-depth-2 hover:shadow-depth-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="bg-warning/10 text-warning w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Compass size={24} />
              </div>
              <h3 className="text-h4 font-bold text-white mb-2">Something Different</h3>
              <p className="text-sm text-zinc-500">Explore genres and styles that are less represented in your collection.</p>
              {!hasCollection && <div className="absolute inset-0 flex items-center justify-center bg-void/80 rounded-[24px] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-xs font-bold text-white bg-surface-3 px-3 py-1 rounded-full">Requires Collection Data</span></div>}
           </button>

           <button onClick={() => handleDiscover('Surprise')} className="group bg-surface-1 hover:bg-surface-2 border border-white/5 hover:border-white/20 rounded-[24px] p-8 text-left transition-all duration-300 shadow-depth-2 hover:shadow-depth-3">
              <div className="bg-white/5 text-white w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Dices size={24} />
              </div>
              <h3 className="text-h4 font-bold text-white mb-2">Surprise Me</h3>
              <p className="text-sm text-zinc-500">A completely open-ended but highly rated discovery pick.</p>
           </button>

        </div>
      </div>
    );
  }

  // 2. Generating State
  if (isGenerating) {
     return (
        <div className="max-w-4xl mx-auto pt-32 pb-32 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Loader2 size={64} className="text-primary animate-spin relative z-10" />
           </div>
           <h2 className="text-h2 font-bold text-white mb-2">Analyzing your universe...</h2>
           <p className="text-zinc-400">Finding the perfect match based on {mode === 'Taste' ? 'your DNA' : mode === 'Different' ? 'undiscovered frontiers' : 'global popularity'}.</p>
        </div>
     );
  }

  // 3. Error State
  if (error) {
     return (
        <div className="max-w-xl mx-auto pt-32 text-center">
           <div className="bg-error/10 border border-error/20 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-error mb-4">Discovery Failed</h2>
              <p className="text-error/80 mb-6">{error}</p>
              <Button onClick={() => setError(null)} variant="secondary">Try Again</Button>
           </div>
        </div>
     );
  }

  // 4. Result Reveal
  const anime = result.anime;
  const bannerUrl = anime.bannerImage || anime.coverImage?.extraLarge;
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const title = anime.title?.english || anime.title?.romaji;
  
  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 pt-4 md:pt-12">
       
       <button onClick={() => setResult(null)} className="text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-colors">
          <ArrowRight className="rotate-180" size={16} /> Back to Discovery
       </button>

       <div className="relative bg-surface-1 rounded-[32px] overflow-hidden border border-white/5 shadow-depth-4 animate-in fade-in zoom-in-95 duration-700 ease-out">
          
          {/* Banner Background */}
          {bannerUrl && (
             <div className="absolute inset-0 h-[300px] md:h-[400px] w-full z-0 opacity-30 mask-image-b">
                <img src={bannerUrl} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/50 to-transparent" />
             </div>
          )}

          <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-end">
             
             {/* Poster */}
             <div className="w-40 md:w-64 shrink-0 rounded-2xl overflow-hidden shadow-depth-5 border border-white/10 -mt-20 md:-mt-32">
                <img src={posterUrl} alt={title} className="w-full h-full object-cover aspect-[2/3]" />
             </div>

             {/* Metadata */}
             <div className="flex-1 w-full pt-0 md:pt-16">
                
                {/* Reason Pill */}
                <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                   <Sparkles size={14} /> {mode === 'Taste' ? 'Perfect Match' : mode === 'Different' ? 'New Frontier' : 'Surprise Pick'}
                </div>

                <h1 className="text-display-s md:text-display-m font-bold text-white mb-2 leading-tight">
                   {title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 font-medium mb-6">
                   <span className="flex items-center gap-1 text-white bg-surface-3 px-2 py-1 rounded">
                      <span className="text-accent">★</span> {(anime.averageScore / 10).toFixed(1)}
                   </span>
                   {anime.episodes && <span>{anime.episodes} Episodes</span>}
                   {anime.format && <span>{anime.format}</span>}
                   {anime.status && <span>{anime.status.replace('_', ' ')}</span>}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                   {anime.genres?.map(g => (
                      <span key={g} className="text-xs text-zinc-400 bg-surface-2 border border-white/5 px-2.5 py-1 rounded-full">
                         {g}
                      </span>
                   ))}
                </div>

                <div className="bg-surface-2/80 backdrop-blur border border-white/5 rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-500">
                   <p className="text-body-l text-white italic">"{result.reason}"</p>
                </div>

             </div>
          </div>

          {/* Synopsis & Actions */}
          <div className="p-6 md:p-12 pt-0 border-t border-white/5 bg-surface-1 flex flex-col md:flex-row gap-12">
             <div className="flex-1">
                <h3 className="text-h4 font-bold text-white mb-4">Synopsis</h3>
                <div 
                   className="text-body-m text-zinc-400 leading-relaxed max-w-3xl line-clamp-6"
                   dangerouslySetInnerHTML={{ __html: anime.description || "No synopsis available." }}
                />
             </div>
             
             <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                <Button 
                   onClick={() => navigate(`/anime/${anime.idMal}`)}
                   variant="primary" 
                   className="w-full h-14 text-base"
                >
                   View Details
                </Button>
                
                <Button 
                   onClick={handleAdd}
                   disabled={isAdding || addSuccess}
                   variant="secondary" 
                   className="w-full h-14 text-base"
                >
                   {isAdding ? <Loader2 size={20} className="animate-spin" /> : addSuccess ? 'In Collection' : <><Plus size={20} /> Add to Collection</>}
                </Button>

                <Button 
                   onClick={() => handleDiscover(mode)}
                   variant="ghost" 
                   className="w-full h-14 text-base mt-2"
                >
                   <RefreshCw size={20} className="mr-2" /> Roll Again
                </Button>
             </div>
          </div>

       </div>
    </div>
  );
}
