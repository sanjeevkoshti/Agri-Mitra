import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, CreditCard, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Counter Offer State
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [currentCounterOrder, setCurrentCounterOrder] = useState(null);
  const [counterQuantity, setCounterQuantity] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [errors, setErrors] = useState({});

  // Harvest List State
  const [showHarvestModal, setShowHarvestModal] = useState(false);

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
    setErrors({});
    const confirmed = newStatus === 'rejected' 
      ? window.confirm('Are you sure you want to reject this order?')
      : true;
    if (!confirmed) return;
    const res = await api.updateOrder(orderId, { status: newStatus });
    if (res.success) {
      fetchOrders();
    }
  };

  const submitCounterOffer = async () => {
    if (!currentCounterOrder) return;
    
    const newErrors = {};
    if (!counterQuantity || Number(counterQuantity) <= 0) {
      newErrors.quantity = t('err_enter_qty') || 'Quantity must be > 0.';
    }
    if (!counterPrice || Number(counterPrice) <= 0) {
      newErrors.price = t('err_enter_price') || 'Price must be > 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await api.updateOrder(currentCounterOrder.id, { 
      status: 'counter_offered', 
      proposed_quantity_kg: Number(counterQuantity),
      proposed_price_per_kg: Number(counterPrice)
    });
    if (res.success) {
      setShowCounterModal(false);
      setCurrentCounterOrder(null);
      fetchOrders();
    } else {
      setErrors({ submit: res.error || 'Failed to submit counter offer.' });
    }
  };

  const acceptCounterOffer = async (order) => {
    const res = await api.updateOrder(order.id, {
      status: 'accepted',
      quantity_kg: order.proposed_quantity_kg,
      price_per_kg: order.proposed_price_per_kg
    });
    if (res.success) fetchOrders();
  };

  const getHarvestTotals = () => {
    // Only include orders that the farmer has committed to (Accepted or Paid)
    const activeOrders = orders.filter(o => ['accepted', 'paid'].includes(o.status));
    const totals = {};
    activeOrders.forEach(o => {
      if (!totals[o.crop_name]) totals[o.crop_name] = { qty: 0, count: 0 };
      totals[o.crop_name].qty += Number(o.quantity_kg) || 0;
      totals[o.crop_name].count += 1;
    });
    return Object.entries(totals).map(([name, data]) => ({ name, ...data }));
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
                      <span className="text-xl font-black text-primary-dark uppercase">
                        {t(`data.${order.crop_name}`) !== `data.${order.crop_name}` ? t(`data.${order.crop_name}`) : order.crop_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {order.quantity_kg} kg</span>
                      <span className="flex items-center gap-1 font-black text-primary">₹{(order.total_price || (order.quantity_kg * order.price_per_kg) || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mt-3 pt-3 border-t border-primary/5 flex flex-wrap items-center gap-2">
                      {profile.role === 'farmer' ? (
                        <>
                          <span className="font-bold text-text-muted">{t('buyer') || 'Buyer'}:</span>
                          <span className="font-black text-primary-dark">{order.retailer_name || 'N/A'}</span>
                          {order.retailer_stats && order.retailer_stats.total > 0 && (
                            <span className={`px-2 py-0.5 rounded-full bg-white border border-primary/10 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm ${
                              (order.retailer_stats.delivered / order.retailer_stats.total) >= 0.8 ? 'text-success' : 'text-text-muted'
                            }`}>
                              <TrendingUp className="w-2.5 h-2.5" />
                              {Math.round((order.retailer_stats.delivered / order.retailer_stats.total) * 100)}% {t('trust_score') || 'Trust'}
                              <span className="opacity-50 ml-1">({order.retailer_stats.delivered}/{order.retailer_stats.total})</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-text-muted">{t('pickup') || 'Pickup'}: {order.pickup_location || t('location_not_set') || 'Location not set'}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    {/* Farmer Actions */}
                    {profile.role === 'farmer' && order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(order.id, 'accepted')} className="btn btn-primary btn-sm px-6 rounded-full font-black">✅ {t('accept') || 'Accept'}</button>
                        <button 
                          onClick={() => {
                            setCurrentCounterOrder(order);
                            setErrors({});
                            setCounterQuantity(order.quantity_kg);
                            setCounterPrice(order.price_per_kg);
                            setShowCounterModal(true);
                          }} 
                          className="btn btn-accent btn-sm px-4 rounded-full font-black">🔄 {t('counter_offer_btn') || 'Counter Offer'}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'rejected')} className="btn btn-sm px-6 rounded-full font-black bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white">❌ {t('reject') || 'Reject'}</button>
                      </div>
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

                    {profile.role === 'retailer' && order.status === 'counter_offered' && (
                      <div className="flex flex-col gap-2 w-full mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <div className="flex items-center gap-2 text-accent-dark font-black uppercase text-sm">
                          <AlertCircle className="w-4 h-4 text-accent" /> {t('counter_title') || 'Counter Offer Received'}
                        </div>
                        <p className="text-xs font-bold text-text-muted">{t('counter_desc') || "The farmer has proposed a different quantity or price."}</p>
                        <div className="flex items-center justify-between mt-2 text-sm bg-white p-3 rounded-lg border border-primary/5">
                           <div className="line-through opacity-40 flex flex-col items-center">
                             <span className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">{t('original_qty') || 'Original'}</span>
                             <span className="font-bold">{order.quantity_kg}kg @ ₹{order.price_per_kg}</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-primary opacity-30" />
                           <div className="font-black text-accent-dark flex flex-col items-center">
                             <span className="text-[10px] uppercase font-black tracking-widest text-accent mb-1">{t('proposed_qty') || 'Proposed'}</span>
                             <span>{order.proposed_quantity_kg}kg @ ₹{order.proposed_price_per_kg}</span>
                           </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                           <button onClick={() => acceptCounterOffer(order)} className="btn btn-primary btn-sm flex-1 rounded-full font-black">{t('accept_counter_btn') || 'Accept Counter'}</button>
                           <button onClick={() => updateStatus(order.id, 'rejected')} className="btn btn-outline border-danger text-danger hover:bg-danger/10 btn-sm flex-1 rounded-full font-black">{t('reject_counter_btn') || 'Reject Offer'}</button>
                        </div>
                      </div>
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

          {profile.role === 'farmer' && orders.some(o => ['accepted', 'paid'].includes(o.status)) && (
            <button 
              onClick={() => setShowHarvestModal(true)}
              className="w-full card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex flex-col items-center gap-2 group"
            >
              <Package className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block font-black text-xs uppercase tracking-widest text-primary-dark">{t('harvest_list') || 'Daily Harvest List'}</span>
                <span className="block text-[10px] font-bold text-text-muted mt-1">{t('harvest_desc') || 'See total harvest needs for today'}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Counter Offer Modal */}
      {showCounterModal && currentCounterOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-primary/10">
            <h3 className="text-2xl font-heading font-black text-primary-dark mb-2 uppercase tracking-wide">
              {t('propose_new_terms') || 'Propose New Terms'}: {t(`data.${currentCounterOrder.crop_name}`) !== `data.${currentCounterOrder.crop_name}` ? t(`data.${currentCounterOrder.crop_name}`) : currentCounterOrder.crop_name}
            </h3>
            <p className="text-sm font-bold text-text-muted mb-6">
              {t('modify_order_desc') || "Adjust the quantity or price for this order. The retailer will have to accept your new terms."}
            </p>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest">{t('proposed_qty') || 'Proposed Quantity'} (kg)</label>
                <input 
                  type="number" 
                  value={counterQuantity} 
                  onChange={e => {
                    setCounterQuantity(e.target.value);
                    if (errors.quantity) setErrors({...errors, quantity: null});
                  }} 
                  className={`w-full mt-2 border-2 ${errors.quantity ? 'border-red-500 text-red-700' : 'border-primary/20'} p-4 rounded-2xl font-black text-lg focus:border-primary outline-none bg-bg`} 
                />
                {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{errors.quantity}</p>}
              </div>
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest">{t('proposed_price') || 'Proposed Price'} (₹/kg)</label>
                <input 
                  type="number" 
                  value={counterPrice} 
                  onChange={e => {
                    setCounterPrice(e.target.value);
                    if (errors.price) setErrors({...errors, price: null});
                  }} 
                  className={`w-full mt-2 border-2 ${errors.price ? 'border-red-500 text-red-700' : 'border-primary/20'} p-4 rounded-2xl font-black text-lg focus:border-primary outline-none bg-bg`} 
                />
                {errors.price && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{errors.price}</p>}
              </div>
              
              <div className="flex gap-4 mt-8 pt-4 border-t border-primary/10">
                <button 
                  onClick={() => {
                    setShowCounterModal(false);
                    setCurrentCounterOrder(null);
                  }} 
                  className="flex-1 btn btn-outline rounded-full font-black"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={submitCounterOffer} 
                  className="flex-1 btn btn-primary rounded-full font-black"
                >
                  {t('submit') || 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harvest List Modal */}
      {showHarvestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-primary/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-heading font-black text-primary-dark uppercase tracking-wide">
                {t('total_harvest_summary') || 'Total Harvest Summary'}
              </h3>
              <button onClick={() => setShowHarvestModal(false)} className="text-text-muted hover:text-primary-dark">
                <Package className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3 mb-8">
              {getHarvestTotals().length > 0 ? (
                getHarvestTotals().map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg border border-primary/5">
                    <div className="flex flex-col">
                      <span className="font-black text-primary-dark uppercase">{t(`data.${item.name}`) !== `data.${item.name}` ? t(`data.${item.name}`) : item.name}</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.count} {t('active_orders') || 'Orders'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary">{item.qty} kg</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 font-bold text-text-muted">{t('no_active_to_harvest') || 'No active orders to harvest currently.'}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const text = getHarvestTotals().map(i => `${i.name}: ${i.qty}kg (${i.count} orders)`).join('\n');
                  navigator.clipboard.writeText(text);
                  alert('Summary copied to clipboard!');
                }}
                className="flex-1 btn btn-outline rounded-full font-black flex items-center justify-center gap-2"
              >
                {t('copy_list') || 'Copy List'}
              </button>
              <button 
                onClick={() => setShowHarvestModal(false)} 
                className="flex-1 btn btn-primary rounded-full font-black"
              >
                {t('done') || 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return 'bg-warning/20 text-warning';
    case 'counter_offered': return 'bg-accent text-white shadow ring-2 ring-accent/30';
    case 'accepted': return 'bg-info/20 text-info';
    case 'paid': return 'bg-success/20 text-success';
    case 'transit': return 'bg-accent/20 text-accent';
    case 'delivered': return 'bg-primary/20 text-primary';
    case 'rejected': return 'bg-danger/20 text-danger';
    default: return 'bg-bg text-text-muted';
  }
};

export default Orders;
