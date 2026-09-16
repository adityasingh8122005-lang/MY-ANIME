const fs = require('fs');
let code = fs.readFileSync('src/components/Notifications.jsx', 'utf8');

code = code.replace(
  'import { useState, useEffect } from \'react\';',
  'import { useState, useEffect, useRef } from \'react\';'
);

const newLogic = `
  const [updates, setUpdates] = useState([]);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
`;

code = code.replace(
  `  const [updates, setUpdates] = useState([]);\n  const [show, setShow] = useState(false);`,
  newLogic
);

code = code.replace(
  '<div className="relative flex items-center">',
  '<div className="relative flex items-center" ref={dropdownRef}>'
);

code = code.replace(
  'onClick={() => setShow(!show)}',
  'onClick={(e) => { e.stopPropagation(); setShow(prev => !prev); }}'
);

fs.writeFileSync('src/components/Notifications.jsx', code);
