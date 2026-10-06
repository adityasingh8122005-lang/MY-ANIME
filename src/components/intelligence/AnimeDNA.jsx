import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnimeDNA({ dna }) {
  const navigate = useNavigate();
  const [hoveredGenre, setHoveredGenre] = useState(null);

  if (!dna || dna.length === 0) {
    return (
      <div className="w-full h-full bg-surface-1 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
        <h3 className="text-xl font-bold text-white mb-2">Your Anime DNA hasn't formed yet.</h3>
        <p className="text-zinc-500 mb-6">Start building your collection to unlock your profile.</p>
        <button onClick={() => navigate('/search')} className="bg-primary text-white font-bold px-6 py-2 rounded-full shadow-depth-2 hover:bg-primary-hover transition-colors">
          Discover Anime
        </button>
      </div>
    );
  }

  if (dna.length < 3) {
    return (
      <div className="w-full h-full bg-surface-1 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
        <h3 className="text-xl font-bold text-white mb-2">Your Anime DNA is still forming.</h3>
        <p className="text-zinc-500">Watch a few more anime to unlock a stronger profile (needs at least 3 genres).</p>
      </div>
    );
  }

  // Draw Radar Chart
  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 40;
  const numAxes = dna.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Generate axes lines
  const axes = dna.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (radius + 25) * Math.cos(angle),
      labelY: center + (radius + 20) * Math.sin(angle),
      angle,
      ...d
    };
  });

  // Generate DNA Polygon points
  const points = axes.map(axis => {
    const p = Math.max(0.1, axis.percentage / 100);
    const px = center + (radius * p) * Math.cos(axis.angle);
    const py = center + (radius * p) * Math.sin(axis.angle);
    return `${px},${py}`;
  }).join(' ');

  return (
    <div className="w-full bg-surface-1 rounded-[24px] border border-white/5 p-6 shadow-depth-4 flex flex-col md:flex-row gap-8 items-center min-h-[400px]">
      
      {/* Radar SVG */}
      <div className="relative w-[300px] h-[300px] shrink-0">
         <svg width={size} height={size} className="overflow-visible">
            {/* Grid Circles */}
            {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
               <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            
            {/* Axes */}
            {axes.map((axis, i) => (
               <g key={i}>
                  <line x1={center} y1={center} x2={axis.x} y2={axis.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text 
                     x={axis.labelX} 
                     y={axis.labelY} 
                     textAnchor="middle" 
                     dominantBaseline="middle"
                     fill={hoveredGenre === axis.genre ? '#fff' : '#a1a1aa'}
                     className="text-[10px] font-bold uppercase transition-colors"
                     style={{ cursor: 'pointer' }}
                     onMouseEnter={() => setHoveredGenre(axis.genre)}
                     onMouseLeave={() => setHoveredGenre(null)}
                  >
                     {axis.genre}
                  </text>
               </g>
            ))}

            {/* DNA Polygon */}
            <polygon 
               points={points} 
               fill="rgba(139, 92, 246, 0.2)" 
               stroke="#8b5cf6" 
               strokeWidth="2" 
               className="transition-all duration-500 ease-out"
               style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}
            />
            
            {/* DNA Points */}
            {axes.map((axis, i) => {
               const p = Math.max(0.1, axis.percentage / 100);
               const px = center + (radius * p) * Math.cos(axis.angle);
               const py = center + (radius * p) * Math.sin(axis.angle);
               const isHovered = hoveredGenre === axis.genre;
               return (
                  <circle 
                     key={`p-${i}`} 
                     cx={px} 
                     cy={py} 
                     r={isHovered ? 6 : 4} 
                     fill={isHovered ? '#fff' : '#8b5cf6'} 
                     className="transition-all duration-300"
                     onMouseEnter={() => setHoveredGenre(axis.genre)}
                     onMouseLeave={() => setHoveredGenre(null)}
                  />
               );
            })}
         </svg>
      </div>

      {/* Details Panel */}
      <div className="flex-1 flex flex-col justify-center min-w-[200px]">
         {hoveredGenre ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
               <h3 className="text-display-s font-bold text-white uppercase tracking-tight mb-2">
                  {hoveredGenre}
               </h3>
               <div className="text-primary text-h2 font-bold mb-4">
                  {dna.find(d => d.genre === hoveredGenre)?.percentage}%
               </div>
               <p className="text-zinc-400 text-body-m mb-2">
                  Based on <strong className="text-white">{dna.find(d => d.genre === hoveredGenre)?.count} anime</strong> in your collection.
               </p>
               <p className="text-zinc-500 text-sm">
                  Average Rating: <strong className="text-white">{dna.find(d => d.genre === hoveredGenre)?.avgRating.toFixed(1)}/10</strong>
               </p>
            </div>
         ) : (
            <div className="text-zinc-500 flex flex-col gap-3">
               <h3 className="text-h4 font-bold text-white mb-2">Anime DNA</h3>
               <p className="text-sm">Hover over a genre node on the radar to see detailed insights about your specific preferences.</p>
               <p className="text-xs opacity-70">DNA is calculated using a combination of your watched frequency and average personal ratings.</p>
            </div>
         )}
      </div>

    </div>
  );
}
