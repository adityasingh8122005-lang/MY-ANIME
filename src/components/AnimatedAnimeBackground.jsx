import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function AnimatedAnimeBackground({ anime = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Use up to 6 valid images from the existing data
  const validImages = anime
    .map(a => a?.bannerImage || a?.coverImage?.large)
    .filter(Boolean)
    .slice(0, 6);

  useEffect(() => {
    if (validImages.length <= 1) return;
    
    let interval;
    const startInterval = () => {
       interval = setInterval(() => {
         setCurrentIndex(prev => (prev + 1) % validImages.length);
       }, 10000); // 8s hold + 2s crossfade
    };

    const handleVisibility = () => {
       if (document.hidden) {
          clearInterval(interval);
       } else {
          startInterval();
       }
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  return (
    <div 
      className="absolute z-0 pointer-events-none overflow-hidden"
      style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', height: 'calc(100% + 4rem)' }}
    >
      {validImages.map((img, i) => {
         // Keep only 2 DOM layers active at once: current and previous (which is fading out)
         const isCurrent = i === currentIndex;
         const isPrev = i === (currentIndex - 1 + validImages.length) % validImages.length;
         
         if (!isCurrent && !isPrev && validImages.length > 1) return null;

         return (
           <div
             key={img}
             className={clsx(
               "absolute inset-0 bg-cover bg-center transition-opacity ease-in-out",
               !reducedMotion && "animate-cinematic-pan"
             )}
             style={{ 
               backgroundImage: `url("${img}")`,
               transitionDuration: '2000ms',
               opacity: isCurrent ? 0.20 : 0,
               filter: 'blur(24px)'
             }}
           />
         );
      })}
      
      {/* Overlays to ensure readability and maintain premium atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/30 via-transparent to-dark-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-base via-transparent to-dark-base opacity-70" />
      <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
    </div>
  );
}
