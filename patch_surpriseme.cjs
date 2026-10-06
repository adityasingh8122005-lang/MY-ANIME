const fs = require('fs');
let code = fs.readFileSync('src/pages/SurpriseMePage.jsx', 'utf8');

// 1. Fix memory leak with isMounted ref
code = code.replace(
  `export default function SurpriseMePage() {`,
  `import { useRef } from 'react';\n\nexport default function SurpriseMePage() {\n  const isMounted = useRef(true);\n  useEffect(() => {\n    return () => {\n      isMounted.current = false;\n    };\n  }, []);`
);

code = code.replace(
  `      if (!prefersReducedMotion) {
         await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setResult(rec);`,
  `      if (!prefersReducedMotion) {
         await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      if (isMounted.current) {
        setResult(rec);
      }`
);

code = code.replace(
  `} catch (err) {`,
  `} catch (err) {\n      if (!isMounted.current) return;`
);

code = code.replace(
  `} finally {`,
  `} finally {\n      if (isMounted.current) setIsGenerating(false);`
);

// 2. Fix Back button touch target height
code = code.replace(
  `<button onClick={() => setResult(null)} className="text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-colors">`,
  `<button onClick={() => setResult(null)} className="min-h-[44px] text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-colors">`
);

// We have multiple 'import React' issues if we prepend import { useRef }, let's do it cleanly
code = code.replace(
  `import React, { useState, useEffect } from 'react';`,
  `import React, { useState, useEffect, useRef } from 'react';`
);
code = code.replace(`import { useRef } from 'react';\n\n`, ``);

fs.writeFileSync('src/pages/SurpriseMePage.jsx', code);
