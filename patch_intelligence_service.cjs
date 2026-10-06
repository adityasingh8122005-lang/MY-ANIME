const fs = require('fs');
let code = fs.readFileSync('src/services/intelligence/intelligenceService.js', 'utf8');

// 1. Fix Watch Time calculation to detect partial estimation
code = code.replace(
  'let hasKnownDuration = false;',
  'let hasKnownDuration = false;\n  let missingDurationCount = 0;'
);

code = code.replace(
  'if (mins > 0) {\n          totalMinutes += (watched * mins);\n          hasKnownDuration = true;\n        }',
  `if (mins > 0) {
          totalMinutes += (watched * mins);
          hasKnownDuration = true;
        } else {
          missingDurationCount += watched;
        }`
);

// If duration regex didn't match anything but there were watched episodes, it falls here. Wait, what if duration was null?
code = code.replace(
  'if (watched > 0 && a.metadata?.duration) {',
  `if (watched > 0) {
        if (a.metadata?.duration) {`
);
code = code.replace(
  `        if (minMatch) mins += parseInt(minMatch[1], 10);
        if (mins > 0) {
          totalMinutes += (watched * mins);
          hasKnownDuration = true;
        }
      }`,
  `        if (minMatch) mins += parseInt(minMatch[1], 10);
        if (mins > 0) {
          totalMinutes += (watched * mins);
          hasKnownDuration = true;
        } else {
          missingDurationCount += watched;
        }
      } else {
        missingDurationCount += watched;
      }
    }`
);

code = code.replace(
  'const watchHours = hasKnownDuration ? (totalMinutes / 60).toFixed(1) : 0;',
  `const watchHours = hasKnownDuration ? (totalMinutes / 60).toFixed(1) : 0;
  const watchTimeType = missingDurationCount === 0 && hasKnownDuration ? 'Exact Estimate' : hasKnownDuration ? 'Partial Estimate' : 'Unavailable';`
);

code = code.replace(
  'watchHours,',
  'watchHours,\n    watchTimeType,'
);

// 2. Fix DNA Math
code = code.replace(
  `const avgGenreRating = data.ratedCount > 0 ? (data.ratingSum / data.ratedCount) : (avgRating > 0 ? avgRating : 5);
    // Score = count * (rating / 5) -> rewards highly rated genres slightly more
    const score = data.count * (avgGenreRating / 5);`,
  `// If genre has ratings, multiplier is (avg/5). e.g., 10/10 -> 2.0x, 5/5 -> 1.0x, 1/10 -> 0.2x.
    // If no ratings, multiplier is exactly 1.0 so we don't artificially inflate or deflate based on global average.
    const avgGenreRating = data.ratedCount > 0 ? (data.ratingSum / data.ratedCount) : null;
    const multiplier = avgGenreRating !== null ? (avgGenreRating / 5) : 1.0;
    const score = data.count * multiplier;`
);

fs.writeFileSync('src/services/intelligence/intelligenceService.js', code);
