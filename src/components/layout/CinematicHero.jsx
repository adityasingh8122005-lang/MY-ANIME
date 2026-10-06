import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Play, Plus, Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function CinematicHero({ animeList = [] }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (animeList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % Math.min(animeList.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [animeList.length]);

  const handleMouseMove = (e) => {
    if (isMobile) return; // Parallax only on desktop
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Normalize from -1 to 1
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    
    setMousePos({ x, y });
  };

  if (!animeList.length) return null;

  return (
    <div 
      className="relative w-full h-[60vh] sm:h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden rounded-2xl mb-12 shadow-depth-4 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      {/* Background Layers */}
      {animeList.slice(0, 5).map((anime, idx) => {
        const isActive = idx === currentIndex;
        
        // Parallax transform constraints: X ±8px, Y ±6px
        const xOffset = mousePos.x * -8; 
        const yOffset = mousePos.y * -6;

        return (
          <div
            key={anime.idMal}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* Layer 1: Background artwork */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-200 ease-out scale-105"
              style={{
                backgroundImage: `url(${anime.bannerImage || anime.coverImage.large})`,
                transform: !isMobile ? `translate3d(${xOffset}px, ${yOffset}px, 0) scale(1.05)` : 'scale(1.05)'
              }}
            />
            
            {/* Layer 2: Dark atmospheric gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/40 to-transparent sm:via-void/20" />
            
            {/* Layer 4: Hero information */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 pb-12 sm:pb-16 content-container">
              <div 
                className="max-w-2xl transition-transform duration-200 ease-out"
                style={{
                  transform: !isMobile ? `translate3d(${xOffset * -0.5}px, ${yOffset * -0.5}px, 0)` : 'none'
                }}
              >
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {anime.averageScore && (
                    <span className="flex items-center gap-1 text-warning font-bold text-micro sm:text-caption bg-warning/10 px-2 py-1 rounded">
                      <Star size={12} className="fill-warning" />
                      {(anime.averageScore / 10).toFixed(1)}
                    </span>
                  )}
                  {anime.episodes && (
                    <span className="text-zinc-300 text-micro sm:text-caption font-medium px-2 py-1 bg-white/10 rounded">
                      {anime.episodes} Episodes
                    </span>
                  )}
                  {anime.genres && anime.genres[0] && (
                    <span className="text-primary font-bold text-micro sm:text-caption px-2 py-1 bg-primary/10 rounded">
                      {anime.genres[0]}
                    </span>
                  )}
                </div>

                <h2 className="text-h2 sm:text-display-m font-bold text-white mb-4 line-clamp-2 drop-shadow-lg">
                  {anime.title.english || anime.title.romaji}
                </h2>
                
                {anime.description && (
                  <p 
                    className="text-body-s sm:text-body-m text-zinc-300 mb-8 line-clamp-3 max-w-xl drop-shadow-md hidden sm:block"
                    dangerouslySetInnerHTML={{ __html: anime.description }}
                  />
                )}

                {/* Layer 5: CTA Area */}
                <div className="flex items-center gap-4">
                  <Button 
                    variant="premium" 
                    icon={Play}
                    onClick={() => navigate(`/anime/${anime.idMal}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="glass-panel"
                    icon={Plus}
                    onClick={() => navigate(`/anime/${anime.idMal}`)}
                  >
                    <span className="hidden sm:inline">Add to Collection</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
        {animeList.slice(0, 5).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={clsx(
              "w-2 h-2 rounded-full transition-all duration-300 focus-visible-ring",
              idx === currentIndex ? "w-6 bg-primary" : "bg-white/30 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
