const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

// GET all available crops (for marketplace)
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase.safeQuery(() => {
      let query = supabase
        .from('crops')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (req.query.crop_name) {
        query = query.ilike('crop_name', `%${req.query.crop_name}%`);
      }
      return query;
    });
    res.json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Fetch failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});


// GET crops by farmer ID
router.get('/farmer/:farmerId', authMiddleware, async (req, res) => {
  // Ownership check
  if (req.user.id !== req.params.farmerId) {
    return res.status(403).json({ success: false, error: 'Access denied: Cannot view another farmer\'s management dashboard' });
  }

  try {
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('crops')
        .select('*')
        .eq('farmer_id', req.params.farmerId)
        .order('created_at', { ascending: false })
    );

    res.json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Farmer fetch failed for ${req.params.farmerId}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a single crop listing
router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('crops')
        .select('*')
        .eq('id', req.params.id)
        .single()
    );

    res.json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Single fetch failed for ${req.params.id}: ${err.message}`);
    res.status(404).json({ success: false, error: 'Crop not found' });
  }
});

// POST create a new crop listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      farmer_id, farmer_name, farmer_location, farmer_phone,
      crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
    } = req.body;

    // Security check: Ensure the crop is being added by the logged-in farmer
    if (req.user.id !== farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot add crops for another profile' });
    }

    if (!farmer_id || !crop_name || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data } = await supabase.safeQuery(async () => {
      const result = await supabase
        .from('crops')
        .insert([{
          farmer_id, farmer_name, farmer_location, farmer_phone,
          crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
        }])
        .select()
        .single();
      
      if (result.error) {
        // If it's a foreign key violation for the farmer_profile, create it and retry once
        if (result.error.code === '23503' && result.error.message.includes('farmer_profile')) {
          global.serverLog(`[CROPS] Farmer profile missing for ${farmer_id}. Creating...`);
          await supabase.from('farmer_profiles').insert([{ farmer_id }]);
          
          return await supabase
            .from('crops')
            .insert([{
              farmer_id, farmer_name, farmer_location, farmer_phone,
              crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
            }])
            .select()
            .single();
        }
      }
      return result;
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Insert failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update crop availability
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current crop to check ownership
    const { data: existingCrop } = await supabase.safeQuery(() => 
       supabase
        .from('crops')
        .select('farmer_id')
        .eq('id', req.params.id)
        .single()
    );

    if (!existingCrop) {
      return res.status(404).json({ success: false, error: 'Crop listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingCrop.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to edit this listing' });
    }

    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('crops')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
    );

    res.json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Update failed for ${req.params.id}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a crop listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current crop to check ownership
    const { data: existingCrop } = await supabase.safeQuery(() => 
       supabase
        .from('crops')
        .select('farmer_id')
        .eq('id', req.params.id)
        .single()
    );

    if (!existingCrop) {
      return res.status(404).json({ success: false, error: 'Crop listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingCrop.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to delete this listing' });
    }

    await supabase.safeQuery(() => 
      supabase
        .from('crops')
        .delete()
        .eq('id', req.params.id)
    );

    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (err) {
    global.serverLog(`❌ [CROPS] Delete failed for ${req.params.id}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
