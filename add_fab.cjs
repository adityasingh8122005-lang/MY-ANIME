const fs = require('fs');
let code = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Add Dices import
code = code.replace(
  "import { Flame, Loader2 } from 'lucide-react';",
  "import { Flame, Loader2, Dices } from 'lucide-react';"
);

const fabCode = `
      {/* Floating Surprise Me Button */}
      <Link 
        to="/surprise" 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(var(--color-accent),0.4)] backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--color-accent),0.6)] border border-white/10"
      >
        <Dices size={24} />
        Surprise Me
      </Link>
    </div>
  );
}`;

// Inject before the final closing div
code = code.replace(
  "    </div>\n  );\n}",
  fabCode
);

fs.writeFileSync('src/pages/HomePage.jsx', code);
