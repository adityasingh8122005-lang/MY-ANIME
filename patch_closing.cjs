const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// The end of the return statement is:
//       </div>
//       {/* Custom Confirm Modal */}
code = code.replace(
  "      </div>\n      {/* Custom Confirm Modal */}",
  "      </div>\n      </div>\n      {/* Custom Confirm Modal */}"
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
