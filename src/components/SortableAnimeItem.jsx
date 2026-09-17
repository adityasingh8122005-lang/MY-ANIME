import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Folder, GripVertical } from 'lucide-react';
import clsx from 'clsx';

export default function SortableAnimeItem({ item, activeTab, isEditingOrder, viewMode }) {
  const id = item.isFranchise ? item.franchiseId : item.malId;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative'
  };

  const isFranchise = item.isFranchise;
  const to = isFranchise ? `/franchise/${item.franchiseId}` : `/anime/${item.malId}`;

  if (viewMode === 'compact') {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={clsx(
          "relative group rounded-md overflow-hidden bg-dark-surface border transition-colors",
          isDragging ? "border-accent shadow-lg shadow-accent/20" : "border-zinc-800 hover:border-accent"
        )}
      >
        <Link to={to} className="flex flex-row items-center h-16 sm:h-20 pointer-events-auto">
          <div className="w-12 sm:w-14 h-full bg-zinc-900 flex-shrink-0 relative">
            {item.poster ? (
              <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">No Image</div>
            )}
            {(item.totalCanon > 0 || item.canonEpisodes > 0) && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
                <div 
                  className="h-full bg-accent" 
                  style={{ width: `${Math.min(100, ((item.totalWatched ?? item.episodesWatched) / (item.totalCanon ?? item.canonEpisodes)) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 py-2 px-3 flex flex-col justify-center">
            <h3 className="font-bold text-sm text-zinc-200 truncate group-hover:text-white" title={item.title}>
              {item.title}
            </h3>
            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
              {isFranchise ? (
                <span className="flex items-center gap-1 text-accent"><Folder size={10} /> Franchise</span>
              ) : (
                <span className="text-zinc-400">{item.personalStatus}</span>
              )}
              {(activeTab === 'Completed' || activeTab === 'Plan to Watch') && item.airStatus && (
                <>
                  <span className="opacity-50">•</span>
                  <span className={clsx(item.airStatus === 'Ongoing' ? 'text-green-500' : 'text-zinc-600')}>
                    {item.airStatus}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 px-4 text-right hidden sm:block">
            <div className="text-xs font-medium text-zinc-300">
              {item.totalWatched ?? item.episodesWatched ?? 0} / {item.totalCanon ?? item.canonEpisodes ?? '?'}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Eps</div>
          </div>
        </Link>

        {isEditingOrder && (
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/80 to-transparent z-20 flex items-center justify-end pr-4 cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <div className="p-2 bg-zinc-800/80 rounded backdrop-blur-sm text-white">
              <GripVertical size={20} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={clsx(
        "relative group rounded-lg overflow-hidden bg-dark-surface border flex flex-col h-full transition-colors",
        isDragging ? "border-accent shadow-lg shadow-accent/20 scale-105 z-50" : "border-zinc-800 hover:border-accent"
      )}
    >
      <Link to={to} className="flex flex-col h-full pointer-events-auto">
        <div className="aspect-[2/3] w-full bg-zinc-900 relative">
          {item.poster ? (
            <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
          )}
          
          {isFranchise ? (
            <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white shadow flex items-center justify-center z-10">
              <Folder size={14} />
            </div>
          ) : (
            <div className="absolute top-2 right-2 bg-dark-base/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white border border-zinc-700 z-10">
              {item.personalStatus}
            </div>
          )}

          {(item.totalCanon > 0 || item.canonEpisodes > 0) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
              <div 
                className="h-full bg-accent" 
                style={{ width: `${Math.min(100, ((item.totalWatched ?? item.episodesWatched) / (item.totalCanon ?? item.canonEpisodes)) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col z-10 bg-dark-surface">
          <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={item.title}>
            {item.title}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-auto pt-2 flex justify-between items-center">
            <span>{item.totalWatched ?? item.episodesWatched ?? 0} / {item.totalCanon ?? item.canonEpisodes ?? '?'} Eps</span>
            {(activeTab === 'Completed' || activeTab === 'Plan to Watch') && item.airStatus && (
              <span className={clsx(item.airStatus === 'Ongoing' ? 'text-green-500' : 'text-zinc-600')}>
                {item.airStatus}
              </span>
            )}
          </p>
        </div>
      </Link>
      
      {isEditingOrder && (
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        >
          <div className="p-3 bg-zinc-800/90 rounded-full text-white shadow-lg">
            <GripVertical size={28} />
          </div>
        </div>
      )}
    </div>
  );
}
