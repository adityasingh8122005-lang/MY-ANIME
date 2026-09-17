import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { data } = await supabase.from('franchises').select('seasons').ilike('franchise_name', '%Demon Slayer%');
  if (data && data.length > 0) {
    const movies = data[0].seasons.filter(s => s.format === 'MOVIE');
    console.log(movies);
  } else {
    console.log("Not found");
  }
}
run();
