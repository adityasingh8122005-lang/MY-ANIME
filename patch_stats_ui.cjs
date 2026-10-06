const fs = require('fs');
let code = fs.readFileSync('src/pages/StatisticsPage.jsx', 'utf8');

code = code.replace(
  '<span className="text-zinc-400 font-medium mt-2">Estimated Watch Time</span>',
  '<span className="text-zinc-400 font-medium mt-2">{data.watchTimeType}</span>'
);

code = code.replace(
  '{data.watchHours} <span className="text-h3 text-zinc-500">hrs</span>',
  '{data.watchHours > 0 ? data.watchHours : "—"} <span className="text-h3 text-zinc-500">hrs</span>'
);

fs.writeFileSync('src/pages/StatisticsPage.jsx', code);
