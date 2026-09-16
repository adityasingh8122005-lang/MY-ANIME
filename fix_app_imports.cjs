const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove the line added by the other agent
code = code.replace('import { useState, useRef, useEffect as useReactEffect } from "react";', '');

fs.writeFileSync('src/App.jsx', code);
