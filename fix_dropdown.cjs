const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Stop propagation on the button click, and use prev state
code = code.replace(
  'onClick={() => setIsOpen(!isOpen)}',
  'onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}'
);

// Add touchstart to the listener for mobile support
code = code.replace(
  'document.addEventListener("mousedown", handleClickOutside);',
  'document.addEventListener("mousedown", handleClickOutside);\n    document.addEventListener("touchstart", handleClickOutside);'
);
code = code.replace(
  'document.removeEventListener("mousedown", handleClickOutside);',
  'document.removeEventListener("mousedown", handleClickOutside);\n    document.removeEventListener("touchstart", handleClickOutside);'
);

fs.writeFileSync('src/App.jsx', code);
