import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://xjcztqasffxwuzggclnx.supabase.co', 'sb_publishable_lVqtY-d4pDYAE0UChVKjOg_g7l8X5pd');

async function test() {
   const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT 1" });
   console.log("exec_sql:", error ? error.message : "Works");
}
test();
