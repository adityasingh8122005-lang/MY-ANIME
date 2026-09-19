import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function AnimatedAnimeBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
       <div
         className="absolute inset-0 bg-cover bg-center"
         style={{ 
           backgroundImage: `url("/custom-hero.jpg")`,
           opacity: 1
         }}
       />
      
      {/* Hero overlays: preserve true colors, blend bottom smoothly */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/60 via-transparent to-dark-base/80" />
    </div>
  );
}
