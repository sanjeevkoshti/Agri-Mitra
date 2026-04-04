import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, ShoppingBag, MapPin, Package, Heart, Phone, User, Filter, ArrowRight, X, CheckCircle, Calendar, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const Marketplace = () => {
  const { t } = useI18n();
  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderModal, setOrderModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  
  // Order states
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [errors, setErrors] = useState({});
  
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      const res = await api.getCrops(search);
      if (res.success) setCrops(res.data);
      setLoading(false);
    };
    const timer = setTimeout(fetchCrops, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (profile.location) setDeliveryAddress(profile.location);
  }, [profile.location]);

  const handlePlaceOrder = async () => {
    if (!orderModal) return;
    const newErrors = {};

    if (profile.role !== 'retailer') {
      newErrors.submit = 'Only retailers can place orders.';
    }
    if (!deliveryAddress || deliveryAddress.trim() === '') {
      newErrors.address = 'Delivery address is required.';
    }

    const qty = Number(orderQty);
    if (qty <= 0) {
      newErrors.quantity = 'Quantity must be at least 1.';
    } else if (qty > orderModal.quantity_kg) {
      newErrors.quantity = `Only ${orderModal.quantity_kg} kg available.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    const orderData = {
      farmer_id: orderModal.farmer_id,
      retailer_id: profile.id,
      retailer_name: profile.full_name || profile.name,
      retailer_phone: profile.phone,
      crop_id: orderModal._id,
      crop_name: orderModal.crop_name,
      quantity_kg: qty,
      price_per_kg: orderModal.price_per_unit,
      pickup_location: orderModal.farmer_location || orderModal.location,
      delivery_address: deliveryAddress,
      estimated_delivery_date: preferredDate || null,
    };

    const res = await api.placeOrder(orderData);
    if (res.success) {
      alert(t('success_label') + ': Order placed successfully!');
      setOrderModal(null);
    } else {
      setErrors({ submit: res.error || 'Failed to place order' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-primary-dark mb-2">{t('marketplace_title')}</h1>
        <p className="text-text-muted mb-4">{t('marketplace_subtitle')}</p>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all shadow-soft"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline gap-2 px-6"><Filter className="w-4 h-4" /> {t('clear_btn')}</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-primary">{t('finding_prices') || 'Finding the best prices...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {crops.length === 0 ? (
            <div className="col-span-full py-20 text-center card bg-white">
              <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-bold mb-2">{t('no_orders_yet') === 'No orders yet' ? 'No crops found matching' : t('no_orders_yet')} "{search}"</h3>
              <p className="text-text-muted">{t('try_different_search') || 'Try a different name or search for all crops.'}</p>
              <button onClick={() => setSearch('')} className="btn btn-primary mt-6">{t('search_btn')} {t('all') || 'All'}</button>
            </div>
          ) : (
            crops.map(crop => (
              <div key={crop._id} className="card group hover:-translate-y-1 overflow-hidden">
                <div className="relative h-32 bg-primary/5 -mx-5 -mt-5 mb-3 flex items-center justify-center text-4xl">
                   {crop.image_url ? (
                     <img src={crop.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                   ) : (
                     crop.crop_name && crop.crop_name.toLowerCase().includes('tomato') ? '🍅' : 
                     crop.crop_name && crop.crop_name.toLowerCase().includes('onion') ? '🧅' : 
                     crop.crop_name && crop.crop_name.toLowerCase().includes('wheat') ? '🌾' : 
                     crop.crop_name && crop.crop_name.toLowerCase().includes('potato') ? '🥔' : '🌿'
                   )}
                </div>
                <div className="flex justify-between items-start mb-1 px-1">
                  <h3 className="text-lg font-extrabold text-primary-dark truncate pr-2">{(crop.crop_name && t(`data.${crop.crop_name}`) !== `data.${crop.crop_name}`) ? t(`data.${crop.crop_name}`) : crop.crop_name}</h3>
                  <button className="text-text-muted hover:text-danger flex-shrink-0"><Heart className="w-4 h-4" /></button>
                </div>
                <div className="text-xl font-black text-primary mb-3 px-1">₹{crop.price_per_unit || 0}<span className="text-[10px] text-text-muted">/{(crop.unit && t(`data.${crop.unit}`)) || crop.unit || 'unit'}</span></div>
                
                <div className="space-y-2 mb-4 px-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary-dark">
                    <User className="w-4 h-4 text-primary" /> {crop.farmer_name || t('unknown_farmer') || 'Unknown Farmer'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted"><MapPin className="w-4 h-4" /> {crop.farmer_location || t('na') || 'N/A'}</div>
                  <div className="flex items-center gap-2 text-sm text-text-muted"><Package className="w-4 h-4" /> {t('quantity_label')}: {crop.quantity_kg || 0} kg</div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setOrderModal(crop); 
                      setOrderQty(crop.quantity_kg || 1); 
                      setErrors({});
                    }}
                    className="flex-grow btn btn-primary py-2 text-sm gap-1"
                  >
                    <ShoppingBag className="w-4 h-4" /> {t('place_order_btn')}
                  </button>
                  <button
                    onClick={() => setContactModal(crop)}
                    className="btn btn-outline py-2 px-3 border-primary/30 rounded-large hover:border-primary"
                    title={t('contact_farmer') || "Contact Farmer"}
                  >
                    <Phone className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-lg p-8 animate-in slide-in-from-bottom-5 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-heading font-black">{t('place_order_btn')}</h2>
              <button onClick={() => setOrderModal(null)} className="p-1 hover:bg-bg rounded"><X className="w-6 h-6"/></button>
            </div>
            
            <p className="text-text-muted mb-6">{t('buying_directly_from') || 'Buying directly from'} <span className="font-bold text-primary-dark">{orderModal.farmer_name}</span></p>
            
            <div className="space-y-4 mb-8 bg-bg p-4 rounded-large border border-primary/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold opacity-60">{t('crop_name')}</span>
                <span className="font-black text-primary-dark">{t(`data.${orderModal.crop_name}`) !== `data.${orderModal.crop_name}` ? t(`data.${orderModal.crop_name}`) : orderModal.crop_name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('quantity_label')}</label>
                  <div className="relative">
                    <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="number" min="1"
                      className={`w-full pl-10 pr-3 py-2 rounded-small border-2 ${errors.quantity ? 'border-red-500' : 'border-primary/20'} font-bold outline-none focus:border-primary transition-all`}
                      value={orderQty}
                      onChange={(e) => {
                        setOrderQty(e.target.value);
                        if (errors.quantity) setErrors({...errors, quantity: null});
                      }}
                    />
                  </div>
                  {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{errors.quantity}</p>}
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('preferred_date')}</label>
                   <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="date"
                      className="w-full pl-10 pr-3 py-2 rounded-small border-2 border-primary/20 font-bold outline-none focus:border-primary transition-all"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-primary/10">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('delivery_address')}</label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                  <textarea 
                    className={`w-full pl-10 pr-3 py-2 rounded-small border-2 ${errors.address ? 'border-red-500' : 'border-primary/20'} font-medium outline-none focus:border-primary transition-all h-20`}
                    placeholder={t('delivery_address_placeholder') || "Enter full delivery address..."}
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (errors.address) setErrors({...errors, address: null});
                    }}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{errors.address}</p>}
              </div>
            </div>

            <div className="flex justify-between items-center mb-8 px-2">
              <span className="font-bold text-lg opacity-60">{t('total_amount')}</span>
              <span className="text-3xl font-black text-primary">₹{(orderModal.price_per_unit * orderQty).toLocaleString()}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOrderModal(null)} className="flex-1 btn btn-outline py-4 text-lg">{t('cancel') || 'Cancel'}</button>
              <button onClick={handlePlaceOrder} className="flex-[2] btn btn-primary py-4 text-lg gap-2">{t('place_order_btn')} <CheckCircle className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
      {/* Contact Info Modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-sm p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <h2 className="text-xl font-heading font-black text-primary-dark">{t('farmer_contact_info') || 'Farmer Contact Info'}</h2>
              <button onClick={() => setContactModal(null)} className="p-1 hover:bg-bg rounded text-text-muted"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{t('name') || 'Name'}</div>
                  <div className="font-black text-lg text-primary-dark">{contactModal.farmer_name || (t('name_not_provided') || 'Name not provided')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{t('phone') || 'Phone'}</div>
                  <div className="font-black text-lg">{contactModal.farmer_phone || (t('number_hidden') || 'Number hidden')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center text-info">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{t('location') || 'Location'}</div>
                  <div className="font-black text-lg leading-tight">{contactModal.farmer_location || (t('location_not_specified') || 'Location not specified')}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/10">
              <a 
                href={`tel:${contactModal.farmer_phone}`} 
                className={`w-full btn py-4 gap-2 ${contactModal.farmer_phone ? 'btn-primary' : 'bg-bg text-text-muted cursor-not-allowed border border-primary/10'}`}
                onClick={(e) => !contactModal.farmer_phone && e.preventDefault()}
              >
                <Phone className="w-5 h-5" /> {t('call_now') || 'Call Now'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
