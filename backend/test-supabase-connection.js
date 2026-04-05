require('dotenv').config({ path: 'd:/Pramod/md/Mandi-Connect/backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing GET count...');
  const { count, error } = await supabase.from('spoilage_rescue').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('GET Error:', error.message);
  } else {
    console.log('GET Success, count:', count);
  }

  console.log('Testing POST insert with semi-large text...');
  const longStr = 'x'.repeat(1000 * 100); // 100KB
  const { data, error: postErr } = await supabase.from('spoilage_rescue').insert([
    {
      farmer_id: '3f7c0b46-4b88-4cb6-9543-61707e91467b',
      crop_name: 'test_item',
      quantity_kg: 1,
      discounted_price_per_kg: 1,
      shelf_life_hours: 1,
      description: 'Testing if this works via node script',
      image_url: longStr
    }
  ]).select();

  if (postErr) {
    console.error('POST Error:', postErr.message);
  } else {
    console.log('POST Success, ID:', data[0].id);
  }
}

test();
