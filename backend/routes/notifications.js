const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET all notifications for a user
router.get('/:userId', async (req, res) => {
  // Security: Ensure user is fetching their own notifications
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  try {
    const { data: allNotifications } = await supabase.safeQuery(() => 
      supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', req.params.userId)

        .order('created_at', { ascending: false })
        .limit(50)
    );

    res.json({ success: true, data: allNotifications });

  } catch (err) {
    global.serverLog(`❌ [NOTIFICATIONS] Fetch Error for ${req.params.userId}: ${err.message}`);
    if (err.stack) global.serverLog(err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message, 
      details: err.toString(),
      hint: "Check server logs for full stack trace"
    });
  }
});



// PATCH mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id) // Ensure they own it
        .select()
    );
    res.json({ success: true, data });

  } catch (err) {
    global.serverLog(`❌ Error PATCH notification mark-read: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});



// DELETE a notification
router.delete('/:id', async (req, res) => {
    try {
      await supabase.safeQuery(() => 
        supabase
          .from('notifications')
          .delete()
          .eq('id', req.params.id)
          .eq('user_id', req.user.id)
      );
      res.json({ success: true });

    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
