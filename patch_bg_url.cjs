const fs = require('fs');
let code = fs.readFileSync('src/components/AnimatedAnimeBackground.jsx', 'utf8');

code = code.replace("backgroundImage: `url(${img})`,", "backgroundImage: `url(\"${img}\")`,");
// Also crank opacity to 1.0 just to completely rule out opacity issues
code = code.replace("opacity: isCurrent ? 0.8 : 0,", "opacity: isCurrent ? 1 : 0,");
// Remove bg-dark-base wrapper completely from the outer div to see if it was covering things up (it shouldn't, but let's be sure)
code = code.replace("className=\"absolute z-0 pointer-events-none overflow-hidden bg-dark-base\"", "className=\"absolute z-0 pointer-events-none overflow-hidden\"");

fs.writeFileSync('src/components/AnimatedAnimeBackground.jsx', code);
