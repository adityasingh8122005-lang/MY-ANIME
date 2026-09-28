const fs = require('fs');

let code = fs.readFileSync('src/components/SortableAnimeItem.jsx', 'utf8');

// Import Tilt
code = code.replace(
  "import { Folder, GripVertical } from 'lucide-react';",
  "import { Folder, GripVertical } from 'lucide-react';\nimport Tilt from 'react-parallax-tilt';"
);

// Apply Tilt to grid view
const gridViewMatch = `    <div 
      ref={setNodeRef} 
      style={style} 
      className={clsx(
        "relative group rounded-lg overflow-hidden bg-dark-surface border flex flex-col h-full transition-colors",
        isDragging ? "border-accent shadow-lg shadow-accent/20 scale-105 z-50" : "border-zinc-800 hover:border-accent"
      )}
    >
      <Link to={to} className="flex flex-col h-full pointer-events-auto">`;

const gridViewReplacement = `    <div 
      ref={setNodeRef} 
      style={style} 
      className={clsx(
        "relative flex flex-col h-full",
        isDragging ? "z-50" : ""
      )}
    >
      <Tilt 
        tiltMaxAngleX={10} 
        tiltMaxAngleY={10} 
        scale={1.02} 
        transitionSpeed={400} 
        className={clsx(
          "flex-1 relative group rounded-lg overflow-hidden bg-dark-surface border flex flex-col h-full transition-all",
          isDragging ? "border-accent shadow-lg shadow-accent/20 scale-105" : "border-zinc-800 hover:border-accent hover:shadow-lg hover:shadow-accent/20"
        )}
      >
        <Link to={to} className="flex flex-col h-full pointer-events-auto">`;

code = code.replace(gridViewMatch, gridViewReplacement);

// Close Tilt (before isEditingOrder)
code = code.replace(
  `        </div>\n      </Link>\n      \n      {isEditingOrder`,
  `        </div>\n      </Link>\n      </Tilt>\n      \n      {isEditingOrder`
);

fs.writeFileSync('src/components/SortableAnimeItem.jsx', code);
