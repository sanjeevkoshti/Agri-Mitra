import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Package, Clock, CreditCard, ChevronRight, TrendingUp, AlertCircle, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  
  const { t } = useI18n();
  const { showToast } = useToast();
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
    if (profile.id) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [profile.id, profile.role]);

  const getHarvestTotals = () => {
    const activeOrders = orders.filter(o => ['accepted', 'paid'].includes(o.status));
    const totals = {};
    activeOrders.forEach(o => {
      if (!totals[o.crop_name]) totals[o.crop_name] = { qty: 0, count: 0 };
      totals[o.crop_name].qty += Number(o.quantity_kg) || 0;
      totals[o.crop_name].count += 1;
    });
    return Object.entries(totals).map(([name, data]) => ({ name, ...data }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'counter_offered': return 'bg-accent/20 text-accent-dark border border-accent/30';
      case 'accepted': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'paid': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'transit': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'delivered': return 'bg-primary/20 text-primary-dark border border-primary/30';
      case 'rejected': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const cropEmoji = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('tomato')) return '🍅';
    if (n.includes('onion')) return '🧅';
    if (n.includes('potato')) return '🥔';
    if (n.includes('wheat') || n.includes('grain')) return '🌾';
    if (n.includes('corn') || n.includes('maize')) return '🌽';
    if (n.includes('carrot')) return '🥕';
    if (n.includes('chilli')) return '🌶️';
    return '🥬';
  };

  if (loading) return <div className="p-20 text-center text-primary font-bold">{t('loading_orders') || 'Loading Orders...'}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('order_management') || 'Order Management'}</h1>
          <p className="text-text-muted">{t('manage_trade_desc') || 'Manage your trade and track fulfillment.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {orders.length === 0 ? (
            <div className="card text-center py-20 bg-white shadow-soft">
              <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-10" />
              <h3 className="text-xl font-bold mb-2">{t('no_orders_yet') || 'No orders found yet'}</h3>
              <p className="text-text-muted max-w-sm mx-auto">{t('no_orders_desc') || "Once transactions start happening, they'll appear here for management."}</p>
              <Link to="/marketplace" className="btn btn-primary mt-8 px-10 rounded-full">{t('go_to_marketplace') || 'Go to Marketplace →'}</Link>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id || idx} className="card group hover:border-primary/40 p-6 bg-white overflow-hidden relative shadow-soft border border-slate-100 transition-all rounded-[32px]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex gap-5 items-center flex-1">
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border border-primary/10 overflow-hidden shadow-sm">
                      {order.image_url ? <img src={order.image_url} alt={order.crop_name} className="w-full h-full object-cover" /> : cropEmoji(order.crop_name)}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <Link to={`/order/${order.id}`} className="text-xl font-black text-primary-dark uppercase hover:text-primary transition-colors tracking-tight">
                          {(() => {
                            const rawName = (order.crop_name || '').replace('[RESCUE] ', '');
                            return t(`data.${rawName}`) !== `data.${rawName}` ? t(`data.${rawName}`) : rawName;
                          })()}
                        </Link>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {t(`status_${order.status}`) || order.status}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-5 font-bold">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-40" /> {new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 opacity-40" /> {order.quantity_kg} kg</span>
                        <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">₹{(order.total_price || (order.quantity_kg * order.price_per_kg) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Link to={`/order/${order.id}`} className="btn btn-primary px-8 rounded-full font-black shadow-hard group gap-3 py-3.5 text-xs uppercase tracking-widest">
                      {t('view_details') || 'View Details'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="card bg-primary-dark text-white p-7 rounded-[32px] shadow-hard border-none relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            <h3 className="font-heading font-black text-base mb-5 uppercase tracking-wider opacity-80">{t('trading_stats') || 'Trading Stats'}</h3>
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                <span className="opacity-60 font-black uppercase tracking-[0.2em] text-[10px]">{t('active_orders') || 'Active'}</span>
                <span className="font-black text-accent text-2xl">{orders.filter(o => !['delivered', 'rejected'].includes(o.status)).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-black uppercase tracking-[0.2em] text-[10px]">{t('total_value') || 'Value'}</span>
                <span className="font-black text-accent text-2xl">₹{orders.reduce((sum, o) => sum + ((o.quantity_kg || 0) * (o.price_per_kg || 0)), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {profile.role === 'farmer' && orders.some(o => ['accepted', 'paid'].includes(o.status)) && (
            <button 
              onClick={() => setShowHarvestModal(true)}
              className="w-full card border-primary/20 bg-white hover:bg-primary/5 hover:border-primary/40 transition-all p-7 flex flex-col items-center gap-4 group rounded-[32px] shadow-soft"
            >
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <span className="block font-black text-[11px] uppercase tracking-[0.2em] text-primary-dark">{t('harvest_list') || 'Harvest Summary'}</span>
                <p className="text-[10px] font-bold text-text-muted mt-2 px-2 leading-relaxed opacity-70">{t('harvest_desc') || 'Total harvest needs for active orders'}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Harvest Summary Modal */}
      {showHarvestModal && (
        <div className="fixed inset-0 bg-primary-dark/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] p-12 max-w-lg w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative">
            <div className="absolute top-8 right-8">
              <button onClick={() => setShowHarvestModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Package className="w-3 h-3" /> Logistics Ready
              </div>
              <h3 className="text-3xl font-black text-primary-dark uppercase tracking-tight">
                {t('total_harvest_summary') || 'Harvest List'}
              </h3>
            </div>
            
            <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {getHarvestTotals().length > 0 ? (
                getHarvestTotals().map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[32px] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-soft transition-all">
                    <div className="flex flex-col">
                      <span className="font-black text-primary-dark uppercase text-base tracking-tight">{t(`data.${item.name}`) !== `data.${item.name}` ? t(`data.${item.name}`) : item.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.count} {t('active_orders') || 'Orders'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-primary">{item.qty} <span className="text-[10px] uppercase tracking-widest opacity-60">kg</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 font-bold text-slate-400">{t('no_active_to_harvest') || 'No active orders today.'}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const items = getHarvestTotals();
                  const results = items.map(item => `${item.name}: ${item.qty}kg (${item.count} orders)`);
                  navigator.clipboard.writeText(results.join('\n'));
                  showToast("Copied to clipboard!", "success");
                }}
                className="flex-1 py-5 rounded-3xl border-2 border-slate-100 font-black text-[11px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
              >
                Copy List
              </button>
              <button 
                onClick={() => setShowHarvestModal(false)} 
                className="flex-1 btn btn-primary py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-hard"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
