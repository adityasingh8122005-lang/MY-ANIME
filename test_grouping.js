const results = [
  { title: "Attack on Titan", year: 2013 },
  { title: "Attack on Titan Season 2", year: 2017 },
  { title: "Naruto", year: 2002 },
  { title: "Naruto Shippuden", year: 2007 },
  { title: "One Piece", year: 1999 }
];

function groupFranchises(results) {
  const sorted = [...results].sort((a, b) => (a.year || 9999) - (b.year || 9999));
  const groups = [];
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  sorted.forEach(anime => {
    const titleNorm = normalize(anime.title);
    let matchedGroup = null;
    for (let group of groups) {
      const gTitleNorm = normalize(group.main.title);
      if (gTitleNorm.length > 3 && titleNorm.startsWith(gTitleNorm)) {
        matchedGroup = group;
        break;
      }
    }
    if (matchedGroup) {
      matchedGroup.items.push(anime);
    } else {
      groups.push({ main: anime, items: [anime] });
    }
  });
  return groups;
}

console.log(JSON.stringify(groupFranchises(results), null, 2));
