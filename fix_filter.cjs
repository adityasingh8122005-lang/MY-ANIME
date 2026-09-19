const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

const oldFilter = `  let filtered = collection.filter(item => {
    if (activeTab !== 'All' && item.personalStatus !== activeTab) {
      return false;
    }
    if (activeTab === 'Completed' && completedFilter !== 'All') {
      return item.airStatus === completedFilter;
    }
    return true;
  });`;

const newFilter = `  let filtered = collection.filter(item => {
    if (activeTab === 'All' && item.personalStatus === 'Plan to Watch') {
      return false; // User requested to hide Plan to Watch items from the 'All' tab
    }
    if (activeTab !== 'All' && item.personalStatus !== activeTab) {
      return false;
    }
    if (activeTab === 'Completed' && completedFilter !== 'All') {
      return item.airStatus === completedFilter;
    }
    return true;
  });`;

code = code.replace(oldFilter, newFilter);
fs.writeFileSync('src/pages/MyAnimePage.jsx', code);
