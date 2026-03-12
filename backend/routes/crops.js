const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

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
router.get('/farmer/:farmerId', async (req, res) => {
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
// Note: In production, the JWT from the user would be passed to perform RLS-authenticated inserts.
// For hackathon demo, we accept the farmer_id from the body.
router.post('/', async (req, res) => {
  try {
    const {
      farmer_id, farmer_name, farmer_location, farmer_phone,
      crop_name, quantity_kg, price_per_kg, harvest_date, image_url, description
    } = req.body;

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

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update crop availability
router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crops')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
