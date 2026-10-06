const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

if (!code.includes('import { getCustomCollections, addFranchiseToCustomCollection }')) {
    code = code.replace(
        `import { addFranchiseToDb } from '../services/franchiseService';`,
        `import { addFranchiseToDb } from '../services/franchiseService';\nimport { getCustomCollections, addFranchiseToCustomCollection } from '../services/collectionService';`
    );

    code = code.replace(
        `const [isAddingFranchise, setIsAddingFranchise] = useState(false);`,
        `const [isAddingFranchise, setIsAddingFranchise] = useState(false);\n  const [customCollections, setCustomCollections] = useState([]);\n  const [showColDropdown, setShowColDropdown] = useState(false);`
    );

    code = code.replace(
        `  useEffect(() => {`,
        `  useEffect(() => {\n    getCustomCollections().then(setCustomCollections).catch(console.error);`
    );

    // Find the Add to Collection button block
    const addBtn = `          <Button 
            onClick={handleAddFranchise}
            disabled={isAddingFranchise}
            variant="primary" 
            className="w-full sm:w-auto h-12"
          >
            {isAddingFranchise ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
            Add to Collection
          </Button>`;

    const replacement = `          <div className="relative">
            <Button 
              onClick={handleAddFranchise}
              disabled={isAddingFranchise}
              variant="primary" 
              className="w-full sm:w-auto h-12"
            >
              {isAddingFranchise ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
              Add to Collection
            </Button>
            {customCollections.length > 0 && (
              <Button onClick={() => setShowColDropdown(!showColDropdown)} variant="secondary" className="ml-2 h-12 px-3">
                 <Folder size={18} />
              </Button>
            )}
            {showColDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-surface-1 border border-white/10 rounded-xl shadow-depth-5 py-2 z-50">
                 <div className="px-3 pb-2 text-xs font-bold text-zinc-500 uppercase">Save to Collection</div>
                 {customCollections.map(c => (
                    <button key={c.id} onClick={async () => {
                       try {
                          await addFranchiseToCustomCollection(c.id, userAnime?.franchise_id || String(id));
                          setShowColDropdown(false);
                          alert('Added to ' + c.name);
                       } catch(e) {
                          alert('Failed: ' + e.message);
                       }
                    }} className="w-full text-left px-4 py-2 hover:bg-surface-2 text-sm text-white">
                       {c.name}
                    </button>
                 ))}
              </div>
            )}
          </div>`;

    code = code.replace(addBtn, replacement);
    fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
}
