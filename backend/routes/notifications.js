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
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;

    // Auto-Cleanup: If inbox is full (> 15 notifications), delete the read ones to make space.
    if (allNotifications && allNotifications.length > 15) {
      const readNotificationIds = allNotifications
        .filter(n => n.is_read)
        .map(n => n.id);

      if (readNotificationIds.length > 0) {
        await supabase
          .from('notifications')
          .delete()
          .in('id', readNotificationIds);
        
        // Filter them out from the returned response so user sees the cleaned inbox instantly
        const activeNotifications = allNotifications.filter(n => !n.is_read);
        return res.json({ success: true, data: activeNotifications });
      }
    }

    res.json({ success: true, data: allNotifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // Ensure they own it
      .select();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a notification
router.delete('/:id', async (req, res) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
