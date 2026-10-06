const fs = require('fs');
let code = fs.readFileSync('src/components/intelligence/AnimeUniverse.jsx', 'utf8');

// 1. Accessibility and memory leak fix
// We need to extract the touchstart handler to remove it properly.
code = code.replace(
  `    canvas.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.touches[0].clientX - rect.left;
            mouse.y = e.touches[0].clientY - rect.top;
            let found = null;
            for (const node of simulationNodes) {
                const dx = node.x - mouse.x;
                const dy = node.y - mouse.y;
                if (dx * dx + dy * dy < (node.radius * 3) ** 2) { // wider touch target
                    found = node;
                    break;
                }
            }
            setHoveredNode(found);
            if(found) navigate(\`/anime/\${found.id}\`);
        }
    }, {passive: true});`,
  `    const handleTouchStart = (e) => {
        if(e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            // Account for zoom/pan if we implement it, but for now just raw coordinates
            mouse.x = e.touches[0].clientX - rect.left;
            mouse.y = e.touches[0].clientY - rect.top;
            let found = null;
            for (const node of simulationNodes) {
                const dx = node.x - mouse.x;
                const dy = node.y - mouse.y;
                if (dx * dx + dy * dy < (node.radius * 3) ** 2) { 
                    found = node;
                    break;
                }
            }
            setHoveredNode(found);
            if(found) navigate(\`/anime/\${found.id}\`);
        }
    };
    canvas.addEventListener('touchstart', handleTouchStart, {passive: true});`
);

code = code.replace(
  `      canvas.removeEventListener('click', handleClick);`,
  `      canvas.removeEventListener('click', handleClick);\n      canvas.removeEventListener('touchstart', handleTouchStart);`
);

// 2. Add aria-label to canvas
code = code.replace(
  `<canvas ref={canvasRef} className="absolute inset-0 z-0 touch-none block w-full h-full" />`,
  `<canvas ref={canvasRef} className="absolute inset-0 z-0 touch-none block w-full h-full cursor-grab active:cursor-grabbing" role="img" aria-label={\`Interactive Anime Universe visualization showing \${nodes.length} anime clustered by genre\`} tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter' && hoveredNode) navigate(\`/anime/\${hoveredNode.id}\`); }} />`
);

fs.writeFileSync('src/components/intelligence/AnimeUniverse.jsx', code);
