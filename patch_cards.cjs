const fs = require('fs');

function patchFile(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  
  // Replace old Tilt import
  code = code.replace(/import Tilt from 'react-parallax-tilt';/g, "import { AnimeCard3DWrapper } from '../components/ui/AnimeCard3DWrapper';");
  // ProfilePage is up one directory, so:
  code = code.replace(/import { AnimeCard3DWrapper } from '\.\.\/components\/ui\/AnimeCard3DWrapper';/g, "import { AnimeCard3DWrapper } from '../components/ui/AnimeCard3DWrapper';");

  if (filename === 'src/components/SortableAnimeItem.jsx') {
    code = code.replace("import Tilt from 'react-parallax-tilt';", "import { AnimeCard3DWrapper } from './ui/AnimeCard3DWrapper';");
    code = code.replace(/<Tilt[\s\S]*?className={clsx\([\s\S]*?\)}[\s\S]*?>/g, `<AnimeCard3DWrapper className={clsx("flex-1 relative group rounded-lg overflow-hidden bg-surface-1 border flex flex-col h-full transition-all", isDragging ? "border-primary shadow-depth-2 scale-105" : "border-zinc-800 hover:border-primary")}>`);
    code = code.replace(/<\/Tilt>/g, '</AnimeCard3DWrapper>');
  }

  if (filename === 'src/pages/HomePage.jsx') {
    code = code.replace(/<Tilt[\s\S]*?className="[^"]*">/g, '<AnimeCard3DWrapper>');
    code = code.replace(/<\/Tilt>/g, '</AnimeCard3DWrapper>');
  }

  if (filename === 'src/pages/ProfilePage.jsx') {
    code = code.replace(/<Tilt[\s\S]*?className="[^"]*">/g, '<AnimeCard3DWrapper>');
    code = code.replace(/<\/Tilt>/g, '</AnimeCard3DWrapper>');
  }

  fs.writeFileSync(filename, code);
}

patchFile('src/components/SortableAnimeItem.jsx');
patchFile('src/pages/HomePage.jsx');
patchFile('src/pages/ProfilePage.jsx');
