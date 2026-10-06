const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// Replace the start of the return statement
code = code.replace(
  /<div className="max-w-5xl mx-auto pb-12">[\s\S]*?<div className="flex flex-col md:flex-row gap-8">[\s\S]*?{.*\/\* Left Column - Poster & Actions \*\/}/m,
  `<div className="pb-12 -mt-8 sm:-mt-16 relative">
      {/* Cinematic Banner */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[350px] bg-void overflow-hidden pointer-events-none">
        {banner ? (
          <img src={banner} alt="Banner" className="w-full h-full object-cover opacity-50" />
        ) : anime.poster ? (
          <img src={anime.poster} alt="Banner" className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/40 to-transparent" />
      </div>

      <div className="content-container relative z-10 pt-[15vh] sm:pt-[20vh]">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors focus-visible-ring rounded">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Poster & Actions */}
`
);

// We need to fix the poster styling
code = code.replace(
  /<div className="rounded-lg overflow-hidden border border-zinc-800 bg-dark-surface shadow-lg">/g,
  '<div className="rounded-[20px] overflow-hidden border border-white/10 bg-surface-1 shadow-[0_16px_40px_rgba(0,0,0,0.6)] mb-6 transition-transform hover:-translate-y-1 duration-300">'
);

// We need to move the Title to the right column, so we must inspect how Title is currently rendered.
fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
