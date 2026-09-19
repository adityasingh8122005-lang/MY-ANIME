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
  // Use up to 6 UNIQUE valid images from the existing data
  const rawImages = anime
    .map(a => a?.bannerImage || a?.coverImage?.large || a?.poster)
    .filter(Boolean);
  
  const validImages = [...new Set(rawImages)].slice(0, 6);

  useEffect(() => {
    if (validImages.length <= 1) return;
    
    let interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validImages.length);
    }, 10000);

    const handleVisibility = () => {
       if (document.hidden) {
          clearInterval(interval);
       } else {
          clearInterval(interval);
          interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % validImages.length);
          }, 10000);
       }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [validImages.join(',')]); // Safely re-bind if the exact images change

  if (validImages.length === 0) return null;

  return (
    <div 
      className="absolute z-0 pointer-events-none overflow-hidden"
      style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', top: '-2rem', height: '100vh' }}
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
               opacity: isCurrent ? 1 : 0,
               /* no blur for sharp art */
             }}
           />
         );
      })}
      
      {/* Hero overlays: preserve true colors, blend bottom into page, darken top for navbar */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/70 via-transparent to-dark-base" />
    </div>
  );
}
