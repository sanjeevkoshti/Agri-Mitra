const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

// GET all active rescue listings (retailer view)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('spoilage_rescue')
      .select('*')
      .eq('status', 'active')
      .eq('is_available', true)
      .order('shelf_life_hours', { ascending: true }); // most urgent first

    if (req.query.crop_name) {
      query = query.ilike('crop_name', `%${req.query.crop_name}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Spoilage] Fetch failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET rescue listings by farmer ID
router.get('/farmer/:farmerId', authMiddleware, async (req, res) => {
  // Ownership check
  if (req.user.id !== req.params.farmerId) {
    return res.status(403).json({ success: false, error: 'Access denied: Cannot view another farmer\'s listings' });
  }

  try {
    console.log(`[Spoilage] Fetching for farmer: ${req.params.farmerId}`);
    const { data, error } = await supabase
      .from('spoilage_rescue')
      .select('*')
      .eq('farmer_id', req.params.farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log(`[Spoilage] Found ${data?.length || 0} listings`);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Spoilage] Farmer fetch failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new rescue listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      farmer_id, farmer_name, farmer_phone, farmer_location,
      crop_name, quantity_kg, original_price_per_kg, discounted_price_per_kg,
      discount_percent, shelf_life_hours, description, image_url
    } = req.body;

    // Security check: Ensure the listing is being added by the logged-in farmer
    if (req.user.id !== farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot add listings for another profile' });
    }

    if (!farmer_id || !crop_name || !quantity_kg || !discounted_price_per_kg || !shelf_life_hours) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('spoilage_rescue')
      .insert([{
        farmer_id, farmer_name, farmer_phone, farmer_location,
        crop_name, quantity_kg, original_price_per_kg, discounted_price_per_kg,
        discount_percent, shelf_life_hours, description, image_url,
        status: 'active',
        is_available: true
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[Spoilage] Insert failed:', err.message, err.cause);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update a rescue listing
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current listing to check ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from('spoilage_rescue')
      .select('farmer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingListing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingListing.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to edit this listing' });
    }

    const { data, error } = await supabase
      .from('spoilage_rescue')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Spoilage] Update failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a rescue listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Fetch current listing to check ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from('spoilage_rescue')
      .select('farmer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingListing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // 2. Ownership check
    if (req.user.id !== existingListing.farmer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to delete this listing' });
    }

    const { error } = await supabase
      .from('spoilage_rescue')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Rescue listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
