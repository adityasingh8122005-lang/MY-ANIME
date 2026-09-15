import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getGroupedCollection } from '../services/franchiseService';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [updates, setUpdates] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function checkUpdates() {
      try {
        const data = await getGroupedCollection();
        const stored = JSON.parse(localStorage.getItem('animeCanonCache')) || {};
        
        let newUpdates = [];
        let newCache = {};
        
        data.forEach(item => {
          const id = item.isFranchise ? item.franchiseId : item.malId;
          const currentCanon = item.totalCanon || item.canonEpisodes || 0;
          
          if (stored[id] !== undefined && currentCanon > stored[id]) {
            newUpdates.push(item);
          }
          newCache[id] = currentCanon;
        });

        if (newUpdates.length > 0) {
          setUpdates(newUpdates);
        }
        
        localStorage.setItem('animeCanonCache', JSON.stringify(newCache));
      } catch(e) {}
    }
    checkUpdates();
  }, []);

  return (
    <div className="relative flex items-center">
      <button onClick={() => setShow(!show)} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
        <Bell size={20} />
        {updates.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border border-dark-surface animate-pulse" />
        )}
      </button>

      {show && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dark-elevated border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-zinc-700 bg-zinc-800/50">
            <h3 className="text-sm font-bold text-white">New Episodes/Seasons</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {updates.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">
                You're all caught up! No new content has dropped for your anime.
              </div>
            ) : (
              updates.map((u, i) => (
                <Link 
                  key={i} 
                  to={u.isFranchise ? `/franchise/${u.franchiseId}` : `/anime/${u.malId}`}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0"
                  onClick={() => setShow(false)}
                >
                  <img src={u.poster} alt={u.title} className="w-10 h-14 object-cover rounded" />
                  <div>
                    <p className="text-sm text-white font-medium line-clamp-1">{u.title}</p>
                    <p className="text-xs text-accent mt-1">New content available!</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
