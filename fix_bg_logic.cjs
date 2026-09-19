const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

const newLogic = `
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
`;

code = code.replace(/const validImages =.*?\n\s*\}, \[validImages\.length\]\);/s, newLogic.trim());

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
