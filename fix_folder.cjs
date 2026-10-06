const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');
code = code.replace("MessageSquare, Lightbulb, Star } from 'lucide-react'", "MessageSquare, Lightbulb, Star, Folder } from 'lucide-react'");
fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
