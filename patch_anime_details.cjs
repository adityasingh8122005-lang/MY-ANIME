const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

const oldFallback = `      } else {
        // Fallback to basic if franchise fails
        const added = await updateUserAnime(id, { personalStatus: 'Plan to Watch' });
        setUserAnime(added);
      }`;

const newFallback = `      } else {
        // Fallback to basic if franchise fails
        const { supabase } = await import('../services/supabase.js');
        await supabase.from('anime_metadata').upsert({
          mal_id: anime.mal_id,
          title: anime.title_english || anime.title,
          english_title: anime.title_english,
          poster: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
          episodes: anime.episodes,
          status: anime.status === 'Currently Airing' ? 'Releasing' : (anime.status === 'Not yet aired' ? 'Not yet aired' : 'Finished Airing'),
        }, { onConflict: 'mal_id' });
        const added = await updateUserAnime(id, { personalStatus: 'Plan to Watch' });
        setUserAnime(added);
      }`;

code = code.replace(oldFallback, newFallback);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);
