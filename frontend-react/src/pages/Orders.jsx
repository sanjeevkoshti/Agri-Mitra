import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, CreditCard, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');

  const fetchOrders = async () => {
    setLoading(true);
    let res;
    if (profile.role === 'farmer') res = await api.getOrdersByFarmer(profile.id);
    else res = await api.getOrdersByRetailer(profile.id);
    
    if (res.success) setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (profile.id) fetchOrders();
    else if (!loading) setLoading(false);
  }, [profile.id, profile.role]);

  const updateStatus = async (orderId, newStatus) => {
    const confirmed = newStatus === 'rejected' 
      ? window.confirm('Are you sure you want to reject this order?')
      : true;
    if (!confirmed) return;
    const res = await api.updateOrder(orderId, { status: newStatus });
    if (res.success) {
      fetchOrders();
    }
  };

  if (loading) return <div className="p-20 text-center text-primary font-bold">{t('loading_orders') || 'Loading Orders...'}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('order_management') || 'Order Management'}</h1>
          <p className="text-text-muted">{t('manage_trade_desc') || 'Manage your trade and track fulfillment.'}</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary opacity-60">
          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {t('fulfillment') || 'Fulfillment'}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {t('settlement') || 'Settlement'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {orders.length === 0 ? (
            <div className="card text-center py-20 bg-white">
              <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-10" />
              <h3 className="text-xl font-bold mb-2">{t('no_orders_yet') || 'No orders found yet'}</h3>
              <p className="text-text-muted max-w-sm mx-auto">{t('no_orders_desc') || "Once transactions start happening, they'll appear here for management."}</p>
              <Link to="/marketplace" className="btn btn-primary mt-8 px-10 rounded-full">{t('go_to_marketplace') || 'Go to Marketplace →'}</Link>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id || idx} className="card group hover:border-primary/40">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary-dark uppercase">{order.crop_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {order.quantity_kg} kg</span>
                      <span className="flex items-center gap-1 font-black text-primary">₹{(order.total_price || (order.quantity_kg * order.price_per_kg) || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-3 pt-3 border-t border-primary/5">
                      {profile.role === 'farmer' 
                        ? `${t('buyer') || 'Buyer'}: ${order.retailer_name || 'N/A'}` 
                        : `${t('pickup') || 'Pickup'}: ${order.pickup_location || t('location_not_set') || 'Location not set'}`
                      }
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    {/* Farmer Actions */}
                    {profile.role === 'farmer' && order.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'accepted')} className="btn btn-primary btn-sm px-6 rounded-full font-black">✅ {t('accept') || 'Accept'}</button>
                        <button onClick={() => updateStatus(order.id, 'rejected')} className="btn btn-sm px-6 rounded-full font-black bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white">❌ {t('reject') || 'Reject'}</button>
                      </>
                    )}
                    {profile.role === 'farmer' && order.status === 'paid' && (
                      <button onClick={() => updateStatus(order.id, 'transit')} className="btn btn-accent btn-sm px-6 rounded-full font-black">{t('mark_in_transit') || 'Mark In-Transit'}</button>
                    )}
                    {profile.role === 'farmer' && order.status === 'transit' && (
                      <button onClick={() => updateStatus(order.id, 'delivered')} className="btn btn-primary btn-sm px-6 rounded-full font-black">{t('mark_delivered') || 'Mark Delivered'}</button>
                    )}

                    {/* Retailer Actions */}
                    {profile.role === 'retailer' && order.status === 'accepted' && (
                      <Link to={`/payment/${order.id}`} className="btn btn-accent btn-sm px-6 rounded-full font-black">{t('pay_now') || 'Pay Now'}</Link>
                    )}
                    
                    {/* Track Status - only for Retailers (buyers) */}
                    {profile.role === 'retailer' && (
                      <Link to={`/track/${order.id}`} className="btn btn-outline btn-sm px-6 rounded-full font-black border-primary">🚚 {t('track_status') || 'Track Status'}</Link>
                    )}
                    {/* Farmer sees delivery address */}
                    {profile.role === 'farmer' && order.delivery_address && (
                      <span className="text-xs font-bold text-text-muted border border-primary/10 rounded-full px-3 py-1">📍 {order.delivery_address}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="card bg-primary-dark text-white p-6 rounded-large">
            <h3 className="font-heading font-black text-lg mb-4 uppercase tracking-wider">{t('trading_stats') || 'Trading Stats'}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-bold uppercase tracking-widest">{t('active_orders') || 'Active Orders'}</span>
                <span className="font-black text-accent">{orders.filter(o => !['delivered', 'rejected'].includes(o.status)).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-bold uppercase tracking-widest">{t('total_value') || 'Total Value'}</span>
                <span className="font-black text-accent">₹{orders.reduce((sum, o) => sum + ((o.quantity_kg || 0) * (o.price_per_kg || 0)), 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-8 p-3 bg-white/10 rounded-small border border-white/10">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter mb-2">
                <AlertCircle className="w-4 h-4 text-accent" /> {t('trade_tip') || 'Trade Tip'}
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed font-bold">{t('trade_tip_desc') || 'Timely status updates help build trust and ensure faster payments.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return 'bg-warning/20 text-warning';
    case 'accepted': return 'bg-info/20 text-info';
    case 'paid': return 'bg-success/20 text-success';
    case 'transit': return 'bg-accent/20 text-accent';
    case 'delivered': return 'bg-primary/20 text-primary';
    case 'rejected': return 'bg-danger/20 text-danger';
    default: return 'bg-bg text-text-muted';
  }
};

export default Orders;
