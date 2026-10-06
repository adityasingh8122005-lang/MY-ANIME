import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AnimeUniverse({ nodes }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = e => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { w, h } = dimensions;
    
    // Scale for retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Group nodes by primary genre
    const clusters = {};
    const simulationNodes = nodes.map(n => {
      const primaryGenre = n.genres[0] || 'Unknown';
      if (!clusters[primaryGenre]) {
         // Assign random cluster center within inner 60% of canvas
         clusters[primaryGenre] = {
           x: w * 0.2 + Math.random() * w * 0.6,
           y: h * 0.2 + Math.random() * h * 0.6,
           name: primaryGenre
         };
      }
      return {
        ...n,
        primaryGenre,
        x: w / 2 + (Math.random() - 0.5) * 50,
        y: h / 2 + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: n.rating > 8 ? 12 : n.rating > 0 ? 8 : 6
      };
    });

    let animationFrameId;
    let alpha = 1;

    // Simulation variables
    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      
      let found = null;
      for (const node of simulationNodes) {
        let dx = node.x - mouse.x;
        let dy = node.y - mouse.y;
        if (dx * dx + dy * dy < (node.radius * 2) ** 2) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const handleClick = () => {
      if (hoveredNode) {
        navigate(`/anime/${hoveredNode.id}`);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.touches[0].clientX - rect.left;
            mouse.y = e.touches[0].clientY - rect.top;
            let found = null;
            for (const node of simulationNodes) {
                let dx = node.x - mouse.x;
                let dy = node.y - mouse.y;
                if (dx * dx + dy * dy < (node.radius * 3) ** 2) { // wider touch target
                    found = node;
                    break;
                }
            }
            setHoveredNode(found);
            if(found) navigate(`/anime/${found.id}`);
        }
    }, {passive: true});

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw cluster labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      Object.values(clusters).forEach(c => {
         ctx.fillText(c.name.toUpperCase(), c.x, c.y - 20);
      });

      // Draw edges (very faint)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < simulationNodes.length; i++) {
        for (let j = i + 1; j < simulationNodes.length; j++) {
           const a = simulationNodes[i];
           const b = simulationNodes[j];
           if (a.primaryGenre === b.primaryGenre) {
              let dx = a.x - b.x;
              let dy = a.y - b.y;
              if (dx * dx + dy * dy < 10000) {
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'; // primary color faint
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
           }
        }
      }

      // Draw nodes
      simulationNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        let fillColor = 'rgba(139, 92, 246, 0.6)'; // default primary
        if (node.status === 'Completed') fillColor = 'rgba(34, 197, 94, 0.6)'; // success
        else if (node.status === 'Watching') fillColor = 'rgba(234, 179, 8, 0.6)'; // warning
        
        if (hoveredNode && hoveredNode.id === node.id) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = fillColor;
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        
        // Draw rating indicator
        if (node.rating >= 8) {
           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 1;
           ctx.stroke();
        }
      });
    };

    const simulate = () => {
      if (alpha > 0.01 && !isReducedMotion) {
        // Simple Force Layout logic
        // 1. Attract to cluster centers
        simulationNodes.forEach(node => {
           const target = clusters[node.primaryGenre];
           node.vx += (target.x - node.x) * alpha * 0.02;
           node.vy += (target.y - node.y) * alpha * 0.02;
        });

        // 2. Repel from other nodes
        for (let i = 0; i < simulationNodes.length; i++) {
          for (let j = i + 1; j < simulationNodes.length; j++) {
            const a = simulationNodes[i];
            const b = simulationNodes[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let distSq = dx * dx + dy * dy;
            if (distSq === 0) { distSq = 1; dx = Math.random(); dy = Math.random(); }
            
            const minRadius = a.radius + b.radius + 2;
            if (distSq < minRadius * minRadius) {
               const dist = Math.sqrt(distSq);
               const force = (minRadius - dist) / dist * alpha;
               a.vx += dx * force * 0.5;
               a.vy += dy * force * 0.5;
               b.vx -= dx * force * 0.5;
               b.vy -= dy * force * 0.5;
            } else if (distSq < 2500) {
               // weak repulsion
               const force = 10 / distSq * alpha;
               a.vx += dx * force;
               a.vy += dy * force;
               b.vx -= dx * force;
               b.vy -= dy * force;
            }
          }
        }

        // 3. Update positions with friction
        simulationNodes.forEach(node => {
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.9;
          node.vy *= 0.9;
          
          // bounds
          if (node.x < node.radius) node.x = node.radius;
          if (node.x > w - node.radius) node.x = w - node.radius;
          if (node.y < node.radius) node.y = node.radius;
          if (node.y > h - node.radius) node.y = h - node.radius;
        });

        alpha *= 0.98; // cooling
      }
      
      draw();
      
      // Keep drawing for hover states even if cold
      animationFrameId = requestAnimationFrame(simulate);
    };

    if (isReducedMotion) {
       // Fast forward simulation instantly to avoid motion
       alpha = 1;
       for(let i=0; i<150; i++) {
          simulationNodes.forEach(node => {
             const target = clusters[node.primaryGenre];
             node.vx += (target.x - node.x) * alpha * 0.02;
             node.vy += (target.y - node.y) * alpha * 0.02;
          });
          for (let i = 0; i < simulationNodes.length; i++) {
             for (let j = i + 1; j < simulationNodes.length; j++) {
                const a = simulationNodes[i];
                const b = simulationNodes[j];
                let dx = a.x - b.x;
                let dy = a.y - b.y;
                let distSq = dx * dx + dy * dy;
                const minRadius = a.radius + b.radius + 2;
                if (distSq < minRadius * minRadius) {
                   const dist = Math.sqrt(distSq);
                   const force = (minRadius - dist) / dist * alpha;
                   a.vx += dx * force * 0.5;
                   a.vy += dy * force * 0.5;
                   b.vx -= dx * force * 0.5;
                   b.vy -= dy * force * 0.5;
                }
             }
          }
          simulationNodes.forEach(node => {
            node.x += node.vx; node.y += node.vy; node.vx *= 0.9; node.vy *= 0.9;
            if (node.x < node.radius) node.x = node.radius;
            if (node.x > w - node.radius) node.x = w - node.radius;
            if (node.y < node.radius) node.y = node.radius;
            if (node.y > h - node.radius) node.y = h - node.radius;
          });
          alpha *= 0.95;
       }
       alpha = 0;
       draw();
       animationFrameId = requestAnimationFrame(simulate); // just for hover redraws
    } else {
       simulate();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [nodes, dimensions, isReducedMotion, navigate]);

  if (nodes.length === 0) {
    return (
      <div className="w-full h-96 bg-surface-1 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center p-8">
        <h3 className="text-xl font-bold text-white mb-2">Your Anime Universe is waiting.</h3>
        <p className="text-zinc-500 mb-6">Add your first anime to begin building it.</p>
        <button onClick={() => navigate('/search')} className="bg-primary text-white font-bold px-6 py-2 rounded-full shadow-depth-2 hover:bg-primary-hover transition-colors">
          Discover Anime
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] bg-void rounded-[24px] border border-white/5 overflow-hidden shadow-depth-4 isolate group" ref={containerRef}>
      {/* Zoom / Pan controls (conceptual for desktop) */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="bg-surface-2/80 backdrop-blur text-xs font-mono text-zinc-400 px-3 py-1.5 rounded-full border border-white/10">
            {nodes.length} Nodes • Auto-Layout
         </div>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 z-0 touch-none block w-full h-full" />
      
      {/* Hover Tooltip */}
      {hoveredNode && (
        <div 
           className="absolute z-20 pointer-events-none bg-surface-2 border border-white/10 p-3 rounded-xl shadow-depth-3 backdrop-blur-md min-w-[200px]"
           style={{ 
             left: Math.min(hoveredNode.x + 15, dimensions.w - 220), 
             top: Math.min(hoveredNode.y + 15, dimensions.h - 100) 
           }}
        >
          <h4 className="font-bold text-white text-sm truncate mb-1">{hoveredNode.title}</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-micro font-bold text-primary uppercase bg-primary/10 px-1.5 rounded">{hoveredNode.primaryGenre}</span>
            <span className="text-micro text-zinc-400">{hoveredNode.status}</span>
          </div>
          <div className="text-xs text-zinc-500 flex justify-between">
            <span>Rating: {hoveredNode.rating > 0 ? `${hoveredNode.rating}/10` : '—'}</span>
            <span>Eps: {hoveredNode.episodesWatched}</span>
          </div>
        </div>
      )}
    </div>
  );
}
