import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, X } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';

const NotificationCenter = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useI18n();

  const isFetchingRef = useRef(false);

  const fetchNotifications = async () => {
    if (!userId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await api.getNotifications(userId);
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Fetch failed:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Use recursive timeout instead of setInterval to prevent overlaps
    let timeoutId;
    const poll = async () => {
      await fetchNotifications();
      timeoutId = setTimeout(poll, 30000);
    };
    
    timeoutId = setTimeout(poll, 30000);
    return () => clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    const res = await api.markNotificationRead(id);
    if (res.success) {
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Don't trigger the markAsRead on the parent div
    const res = await api.deleteNotification(id);
    if (res.success) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order_new': return '🌾';
      case 'order_status': return '🔔';
      default: return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2.5 rounded-full hover:bg-slate-100 transition-all relative group"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-ring' : 'text-slate-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 glass-card !p-0 !rounded-3xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="font-heading font-black text-slate-800 uppercase tracking-tight">
              {t('notifications') || 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto bg-slate-50/50">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-slate-100 flex gap-4 transition-colors hover:bg-white cursor-pointer relative group ${!n.is_read ? 'bg-white' : ''}`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className="text-2xl flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm tracking-tight ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        <button
                          onClick={(e) => handleDelete(e, n.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${!n.is_read ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {getRelativeTime(n.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <button
              onClick={fetchNotifications}
              className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              {t('refresh') || 'Refresh Alerts'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
