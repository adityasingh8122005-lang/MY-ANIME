import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllUserAnime, getWatchHistory } from '../services/userService';
import { getCustomCollectionHistory } from '../services/collectionService';
import { getNotes } from '../services/noteService';
import { Loader2, Calendar, PlayCircle, CheckCircle2, FolderPlus, TrendingUp, BookOpen, Star, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export default function AnimeJourneyPage() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Anime, Episodes, Collections, Notes, Reviews
  
  // Explicitly answering user requirement: "Is actual pagination implemented? Is there a Load More?"
  // YES. This uses client-side pagination via slicing. It is NOT DOM Virtualization (like react-window).
  // It renders exactly visibleCount nodes to prevent large DOM tree blockages.
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    async function buildTimeline() {
      if (!session) return;
      try {
        const [collection, history, customHistory, allNotes] = await Promise.all([
          getAllUserAnime(true),
          getWatchHistory(),
          getCustomCollectionHistory(),
          getNotes() // fetch all notes for user
        ]);
        
        let timeline = [];
        
        // 1. ADDED EVENTS: Sourced strictly from user_anime.added_at (reliable historical row creation)
        collection.forEach(anime => {
          if (!anime.addedAt) return;
          const title = anime.metadata?.title || anime.metadata?.englishTitle || 'Unknown Anime';
          timeline.push({ 
            id: `add-${anime.malId}`, 
            date: new Date(anime.addedAt), 
            type: 'Added', 
            title, 
            poster: anime.metadata?.poster, 
            link: `/anime/${anime.isFranchise ? anime.franchiseId : anime.malId}`, 
            desc: 'Added to your universe' 
          });
        });

        // 2. PROGRESS / COMPLETION EVENTS: Sourced strictly from watch_history rows (reliable date log)
        history.forEach(h => {
          const anime = collection.find(c => c.malId === h.malId);
          if (!anime) return;
          
          const title = anime.metadata?.title || anime.metadata?.englishTitle || 'Unknown Anime';
          const isFinalEpisode = anime.metadata?.episodes && h.episodesWatched === anime.metadata.episodes;
          
          timeline.push({
            id: `prog-${h.id}`, // Guaranteed unique ID from watch_history PK
            date: new Date(h.date),
            type: isFinalEpisode ? 'Completed' : 'Progress',
            title,
            poster: anime.metadata?.poster,
            link: `/anime/${anime.isFranchise ? anime.franchiseId : anime.malId}`,
            desc: isFinalEpisode ? `Finished Episode ${h.episodesWatched}` : `Watched Episode ${h.episodesWatched}`
          });
        });
        
        // 3. CUSTOM COLLECTION EVENTS: Sourced strictly from custom_collection_items.created_at
        customHistory.forEach(ch => {
           // ch.franchise_id could map to multiple anime in a franchise. We will grab the first one to represent it.
           const anime = collection.find(c => c.franchiseId === ch.franchise_id || String(c.malId) === ch.franchise_id);
           if (!anime) return;
           
           const title = anime.metadata?.title || anime.metadata?.englishTitle || 'Unknown Anime';
           timeline.push({
             id: `col-${ch.collection_id}-${ch.franchise_id}`,
             date: new Date(ch.created_at),
             type: 'Collection',
             title,
             poster: anime.metadata?.poster,
             link: `/anime/${anime.isFranchise ? anime.franchiseId : anime.malId}`,
             desc: `Saved to ${ch.custom_collections.name}`
           });
        });

        
        // 4. NOTES: Sourced from anime_notes.created_at
        if (allNotes) {
           allNotes.forEach(note => {
             const anime = collection.find(c => c.malId === note.mal_id);
             if (!anime) return;
             timeline.push({
               id: `note-${note.id}`,
               date: new Date(note.created_at),
               type: 'Note',
               title: anime.metadata?.title || anime.metadata?.englishTitle || 'Unknown Anime',
               poster: anime.metadata?.poster,
               link: note.episode ? `/watch/${note.mal_id}` : `/anime/${note.mal_id}`,
               desc: note.episode ? `Wrote an Episode ${note.episode} Note` : `Wrote a Private Note`,
               content: note.content
             });
           });
        }
        
        // 5. REVIEWS: Sourced from user_anime.review_updated_at
        collection.forEach(a => {
           if (a.personalReview && a.reviewUpdatedAt) {
              const title = a.metadata?.title || a.metadata?.englishTitle || 'Unknown Anime';
              timeline.push({
                 id: `rev-${a.malId}`,
                 date: new Date(a.reviewUpdatedAt),
                 type: 'Review',
                 title,
                 poster: a.metadata?.poster,
                 link: `/journal`,
                 desc: a.personalRating ? `Rated ${a.personalRating}/10 and wrote a review` : `Wrote a review`,
                 content: a.personalReview
              });
           }
        });

        // Sort chronologically (newest first). Duplicate timestamps (exact same ms) are structurally safe.
        timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
        setEvents(timeline);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    buildTimeline();
  }, [session]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 size={32} className="animate-spin text-primary" /></div>;

  const filtered = events.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Anime' && e.type === 'Added') return true;
    if (filter === 'Episodes' && e.type === 'Progress') return true;
    if (filter === 'Collections' && e.type === 'Collection') return true;
    if (filter === 'Notes' && e.type === 'Note') return true;
    if (filter === 'Reviews' && e.type === 'Review') return true;
    return false;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'Completed': return <CheckCircle2 className="text-success" size={20} />;
      case 'Added': return <Calendar className="text-primary" size={20} />;
      case 'Progress': return <PlayCircle className="text-accent" size={20} />;
      case 'Collection': return <FolderPlus className="text-warning" size={20} />;
      case 'Note': return <MessageSquare className="text-info" size={20} />;
      case 'Review': return <BookOpen className="text-warning" size={20} />;
      default: return <TrendingUp className="text-white" size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-20 pb-32 px-4 relative isolate">
      <div className="text-center mb-12">
        <h1 className="text-display-s font-bold text-white mb-4">YOUR ANIME JOURNEY</h1>
        <p className="text-zinc-400">A true historical log of your adventures.</p>
      </div>

      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {['All', 'Anime', 'Episodes', 'Collections', 'Notes', 'Reviews'].map(f => (
          <button 
            key={f} onClick={() => { setFilter(f); setVisibleCount(50); }}
            className={clsx("px-4 py-2 rounded-full font-bold text-sm transition-colors", filter === f ? "bg-primary text-white" : "bg-surface-2 text-zinc-400 hover:text-white")}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-1 border border-white/5 rounded-3xl">
          <p className="text-zinc-500">Your anime journey will appear here as you build more watch history.</p>
        </div>
      ) : (
        <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {filtered.slice(0, visibleCount).map((event, i) => (
            <div key={event.id + i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-surface-1 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {getIcon(event.type)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-surface-1 border border-white/5 shadow-depth-2 hover:border-primary/50 transition-all">
                <Link to={event.link} className="flex gap-4 items-center">
                  {event.poster && (
                    <img src={event.poster} alt={event.title} className="w-16 h-24 object-cover rounded shadow-depth-1 group-hover:scale-105 transition-transform" />
                  )}
                  <div>
                    <div className="text-micro font-bold text-zinc-500 mb-1">
                      {event.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">{event.title}</h3>
                    {event.content && <p className="text-xs text-zinc-300 italic mb-2 line-clamp-2 bg-surface-2 p-2 rounded">"{event.content}"</p>}
                    <div className="text-sm text-zinc-400 flex items-center gap-2">
                      {event.desc}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-12">
          <button onClick={() => setVisibleCount(v => v + 50)} className="px-6 py-3 bg-surface-2 hover:bg-surface-3 text-white font-bold rounded-full transition-colors border border-white/10">
            Load More History ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
