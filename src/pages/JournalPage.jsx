import React, { useState, useEffect, useMemo } from 'react';
import { getAllUserAnime } from '../services/userService';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Loader2 } from 'lucide-react';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';

export default function JournalPage() {
   const [entries, setEntries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [sortMode, setSortMode] = useState('recent'); // 'recent', 'highest', 'lowest', 'completed'

   useEffect(() => {
      async function load() {
         try {
            const collection = await getAllUserAnime(true);
            // Journal entries are items with a rating OR a review
            const journalItems = collection.filter(c => c.personalRating > 0 || c.personalReview);
            setEntries(journalItems);
         } catch (e) {
            console.error(e);
         } finally {
            setLoading(false);
         }
      }
      load();
   }, []);

   const sortedEntries = useMemo(() => {
      let arr = [...entries];
      if (sortMode === 'recent') {
         arr.sort((a, b) => new Date(b.reviewUpdatedAt || b.updatedAt) - new Date(a.reviewUpdatedAt || a.updatedAt));
      } else if (sortMode === 'highest') {
         arr.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
      } else if (sortMode === 'lowest') {
         arr.sort((a, b) => {
            const rA = a.personalRating > 0 ? a.personalRating : 99;
            const rB = b.personalRating > 0 ? b.personalRating : 99;
            return rA - rB;
         });
      } else if (sortMode === 'completed') {
         arr = arr.filter(a => a.personalStatus === 'Completed');
         arr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
      return arr;
   }, [entries, sortMode]);

   return (
      <div className="min-h-screen pt-20 pb-32 px-4 relative isolate">
         <AnimatedAnimeBackground />
         <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
               <div>
                  <h1 className="text-display-m font-bold text-white flex items-center gap-3">
                     <BookOpen size={40} className="text-primary" />
                     Anime Journal
                  </h1>
                  <p className="text-zinc-400 mt-2">Your private archive of reviews, ratings, and thoughts.</p>
               </div>
               
               <select 
                  value={sortMode} 
                  onChange={e => setSortMode(e.target.value)}
                  className="bg-surface-2 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-primary shadow-depth-1"
               >
                  <option value="recent">Recently Updated</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="completed">Recently Completed</option>
               </select>
            </div>

            {loading ? (
               <div className="flex justify-center py-32"><Loader2 size={40} className="animate-spin text-primary" /></div>
            ) : sortedEntries.length === 0 ? (
               <div className="bg-surface-1 border border-white/5 rounded-3xl p-12 text-center shadow-depth-2">
                  <BookOpen size={64} className="mx-auto text-zinc-600 mb-6 opacity-50" />
                  <h2 className="text-2xl font-bold text-white mb-3">Your anime journal is empty.</h2>
                  <p className="text-zinc-400 max-w-md mx-auto mb-8">
                     Rate an anime or write your first note to start building your personal history.
                  </p>
                  <Link to="/my-anime" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-glow transition-transform hover:scale-105">
                     View Collection
                  </Link>
               </div>
            ) : (
               <div className="flex flex-col gap-6">
                  {sortedEntries.map(entry => (
                     <div key={entry.malId} className="bg-surface-1 border border-white/5 rounded-2xl p-6 shadow-depth-1 flex flex-col sm:flex-row gap-6">
                        <Link to={`/anime/${entry.malId}`} className="w-24 h-36 bg-surface-2 rounded-xl overflow-hidden shrink-0 block hover:ring-2 ring-primary transition-all">
                           {entry.metadata?.poster ? (
                              <img src={entry.metadata.poster} alt={entry.metadata.title} className="w-full h-full object-cover" />
                           ) : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">No Img</div>}
                        </Link>
                        
                        <div className="flex-1 flex flex-col">
                           <div className="flex justify-between items-start gap-4 mb-2">
                              <Link to={`/anime/${entry.malId}`} className="font-bold text-xl text-white hover:text-primary transition-colors line-clamp-1">
                                 {entry.metadata?.title || 'Unknown Anime'}
                              </Link>
                              {entry.personalRating > 0 && (
                                 <div className="flex items-center gap-1 bg-warning/10 text-warning px-3 py-1 rounded-lg font-bold text-sm shrink-0">
                                    <Star size={14} className="fill-warning" />
                                    {entry.personalRating} / 10
                                 </div>
                              )}
                           </div>
                           
                           <div className="flex items-center gap-3 text-xs font-bold mb-4">
                              <span className="text-zinc-400 bg-surface-2 px-2 py-1 rounded border border-white/5">{entry.personalStatus}</span>
                              {entry.episodesWatched > 0 && <span className="text-zinc-500">Ep {entry.episodesWatched}</span>}
                           </div>
                           
                           <div className="flex-1">
                              {entry.personalReview ? (
                                 <p className="text-sm text-zinc-300 whitespace-pre-wrap bg-surface-2/50 p-4 rounded-xl border border-white/5 italic">
                                    "{entry.personalReview}"
                                 </p>
                              ) : (
                                 <p className="text-sm text-zinc-600 italic">No written review.</p>
                              )}
                           </div>
                           
                           <div className="mt-4 text-xs text-zinc-500 font-medium text-right">
                              Updated {new Date(entry.reviewUpdatedAt || entry.updatedAt).toLocaleDateString()}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
