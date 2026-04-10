const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

// GET all available crops (for marketplace)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('crops')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (req.query.crop_name) {
      query = query.ilike('crop_name', `%${req.query.crop_name}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
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
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('farmer_id', req.params.farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a single crop listing
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
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

    const { data, error } = await supabase
      .from('crops')
      .insert([{
        farmer_id, farmer_name, farmer_location, farmer_phone,
        crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
      }])
      .select()
      .single();

    if (error) {
      // If it's a foreign key violation for the farmer_profile, create it and retry
      if (error.code === '23503' && error.message.includes('farmer_profile')) {
        console.log(`[Crops] Farmer profile missing for ${farmer_id}. Creating...`);
        await supabase.from('farmer_profiles').insert([{ farmer_id }]);
        
        // Retry insertion
        const retry = await supabase
          .from('crops')
          .insert([{
            farmer_id, farmer_name, farmer_location, farmer_phone,
            crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
          }])
          .select()
          .single();
        
        if (retry.error) throw retry.error;
        return res.status(201).json({ success: true, data: retry.data });
      }
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[Crops] Insert failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update crop availability
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current crop to check ownership
    const { data: existingCrop, error: fetchError } = await supabase
      .from('crops')
      .select('farmer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingCrop) {
      return res.status(404).json({ success: false, error: 'Crop listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingCrop.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to edit this listing' });
    }

    const { data, error } = await supabase
      .from('crops')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error(`[Crops] Update failed for ${req.params.id}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a crop listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current crop to check ownership
    const { data: existingCrop, error: fetchError } = await supabase
      .from('crops')
      .select('farmer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingCrop) {
      return res.status(404).json({ success: false, error: 'Crop listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingCrop.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to delete this listing' });
    }

    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
