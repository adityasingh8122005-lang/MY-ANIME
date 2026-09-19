const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

const oldButton = `<Link 
        to="/surprise" 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-accent/50 backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/70 border border-white/10"
      >
        <Dices size={24} />
        Surprise Me
      </Link>`;

const newButton = `<Link 
        to="/surprise-me" 
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-white px-8 py-4 rounded-full font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-zinc-900 hover:border-accent/50 hover:shadow-accent/20 group"
      >
        <Dices size={24} className="text-accent group-hover:-rotate-12 transition-transform duration-300" />
        <span className="tracking-wider">SURPRISE ME</span>
      </Link>`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('src/pages/HomePage.jsx', code);
