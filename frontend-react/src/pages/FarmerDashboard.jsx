import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, Plus, TrendingUp, Clock, Trash2, Edit2, AlertCircle, LayoutDashboard, X, Save, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const FarmerDashboard = () => {
  const { t } = useI18n();
  const [myCrops, setMyCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({});
  const [errors, setErrors] = useState({});
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');

  const fetchDashboardData = async () => {
    setLoading(true);
    const [cropsRes, ordersRes] = await Promise.all([
      api.getCropsByFarmer(profile.id),
      api.getOrdersByFarmer(profile.id)
    ]);
    
    if (cropsRes.success) setMyCrops(cropsRes.data);
    if (ordersRes.success) {
      setOrders(ordersRes.data);
      const pending = ordersRes.data.filter(o => o.status === 'pending').length;
      setPendingCount(pending);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile.id) fetchDashboardData();
    else if (!loading) setLoading(false); // Stop loading if no profile
  }, [profile.id]);

  const handleDelete = async (id) => {
    if (window.confirm(t('delete') + '?')) {
      const res = await api.deleteCrop(id);
      if (res.success) fetchDashboardData();
    }
  };

  const handleEditOpen = (crop) => {
    setEditModal(crop);
    setErrors({});
    setEditData({
      crop_name: crop.crop_name,
      quantity: crop.quantity_kg || crop.quantity,
      price_per_unit: crop.price_per_kg || crop.price_per_unit,
      harvest_date: crop.harvest_date,
      location: crop.farmer_location || crop.location,
      is_available: crop.is_available,
      image_url: crop.image_url
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSave = async () => {
    const newErrors = {};
    if (!editData.crop_name || editData.crop_name.trim() === '') {
      newErrors.crop_name = t('err_enter_crop') || 'Crop name is required.';
    }
    if (!editData.quantity || Number(editData.quantity) <= 0) {
      newErrors.quantity = t('err_enter_qty') || 'Quantity must be > 0.';
    }
    if (!editData.price_per_unit || Number(editData.price_per_unit) <= 0) {
      newErrors.price_per_unit = t('err_enter_price') || 'Price must be > 0.';
    }
    if (!editData.harvest_date) {
      newErrors.harvest_date = 'Harvest date is required.';
    }
    if (!editData.location || editData.location.trim() === '') {
      newErrors.location = 'Location is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await api.updateCrop(editModal._id, editData);
    if (res.success) {
      alert(t('updated_successfully') || 'Updated successfully!');
      setEditModal(null);
      fetchDashboardData();
    } else {
      setErrors({ submit: res.error || (t('err_update') || 'Failed to update') });
    }
  };

  const getFinancialStats = () => {
    const netEarnings = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total_price) || (o.quantity_kg * o.price_per_kg) || 0), 0);
    
    const pendingPayouts = orders
      .filter(o => ['paid', 'transit'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total_price) || (o.quantity_kg * o.price_per_kg) || 0), 0);
      
    const potentialRevenue = orders
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + (Number(o.total_price) || (o.quantity_kg * o.price_per_kg) || 0), 0);

    return { netEarnings, pendingPayouts, potentialRevenue };
  };

  const stats = getFinancialStats();

  if (loading) return <div className="p-20 text-center text-primary font-bold">{t('analyzing_data') || 'Loading Dashboard...'}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" /> {t('dashboard_title')}
          </h1>
          <p className="text-text-muted">{t('dashboard_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-predictor" className="btn btn-outline border-primary text-primary gap-2 font-black uppercase text-xs tracking-widest">
            <TrendingUp className="w-4 h-4" /> {t('ai_predictor_btn')}
          </Link>
          <Link to="/add-crop" className="btn btn-primary gap-2 font-black uppercase text-xs tracking-widest shadow-hard">
            <Plus className="w-4 h-4" /> {t('add_crop_btn')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card bg-primary text-white p-6 shadow-hard relative overflow-hidden">
          <Package className="w-16 h-16 absolute -right-2 -bottom-2 opacity-10" />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{t('active_listings')}</h3>
          <div className="text-4xl font-black">{myCrops.filter(c => c.is_available).length}</div>
        </div>
        <div className="card bg-accent text-primary-dark p-6 shadow-hard relative overflow-hidden">
          <Clock className="w-16 h-16 absolute -right-2 -bottom-2 opacity-10" />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{t('pending_orders')}</h3>
          <div className="text-4xl font-black">{pendingCount}</div>
        </div>
        <div className="card bg-white p-6 border-2 border-primary/10 flex flex-col justify-center">
           <Link to="/orders" className="flex items-center justify-between group">
              <span className="font-black uppercase tracking-widest text-sm text-primary-dark">{t('view_orders_btn')}</span>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <Plus className="w-5 h-5 rotate-45" />
              </div>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 card bg-bg border-2 border-primary/5 p-8 flex flex-col md:flex-row items-center gap-8 shadow-soft">
           <div className="flex-1 w-full space-y-2">
             <h3 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-success" /> {t('earnings_summary') || 'Earnings Summary'}
             </h3>
             <div className="text-5xl font-black text-primary-dark">₹{stats.netEarnings.toLocaleString()}</div>
             <p className="text-xs font-bold text-text-muted">{t('settlement_desc') || 'Total revenue from delivered orders.'}</p>
           </div>
           
           <div className="w-full md:w-auto flex flex-col gap-4">
             <div className="p-4 rounded-xl bg-white border border-primary/10 flex items-center justify-between min-w-[200px]">
               <span className="text-[10px] font-black uppercase text-text-muted">{t('pending_payouts') || 'Pending'}</span>
               <span className="font-black text-info text-lg">₹{stats.pendingPayouts.toLocaleString()}</span>
             </div>
             <div className="p-4 rounded-xl bg-white border border-primary/10 flex items-center justify-between min-w-[200px]">
               <span className="text-[10px] font-black uppercase text-text-muted">{t('potential_revenue') || 'Potential'}</span>
               <span className="font-black text-primary text-lg">₹{stats.potentialRevenue.toLocaleString()}</span>
             </div>
           </div>
        </div>
        
        <Link to="/orders" className="card bg-primary-dark text-white p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-hard group">
           <div className="space-y-2">
             <h3 className="text-sm font-black uppercase tracking-widest opacity-60">{t('latest_activity') || 'Latest Activity'}</h3>
             <p className="text-xs opacity-80 leading-relaxed">{t('check_orders_desc') || 'Manage and track your latest incoming orders from retailers.'}</p>
           </div>
           <div className="flex items-center gap-2 font-black text-accent uppercase tracking-widest mt-6 group-hover:translate-x-2 transition-transform">
             {t('manage_orders') || 'Manage orders'} <Plus className="w-5 h-5 rotate-45" />
           </div>
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-heading font-black text-primary-dark uppercase tracking-wide">{t('my_listings')}</h2>
      </div>

      {myCrops.length === 0 ? (
        <div className="card text-center py-16 bg-white border-dashed border-2 border-primary/20">
          <AlertCircle className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-muted mb-4">{t('no_orders_yet') === 'No orders yet' ? 'No crops listed' : t('no_orders_yet')}</h3>
          <Link to="/add-crop" className="btn btn-primary px-8 rounded-full font-black uppercase text-xs tracking-widest">{t('add_new')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCrops.map(crop => (
            <div key={crop._id} className="card group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {crop.image_url ? (
                    <img src={crop.image_url} className="w-16 h-16 rounded-lg object-cover border border-primary/10 shadow-soft" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-bg border border-dashed border-primary/20 flex items-center justify-center text-2xl">🌱</div>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-primary-dark">{(crop.crop_name && t(`data.${crop.crop_name}`) !== `data.${crop.crop_name}`) ? t(`data.${crop.crop_name}`) : crop.crop_name}</h3>
                    <div className="text-xs font-bold text-text-muted uppercase tracking-widest">{crop.quantity || 0} {(crop.unit && t(`data.${crop.unit}`)) || crop.unit || 'unit'} · ₹{crop.price_per_unit || 0}/{(crop.unit && t(`data.${crop.unit}`)) || crop.unit || 'unit'}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${crop.is_available ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {crop.is_available ? t('available') : t('out_of_stock')}
                </span>
              </div>
              
              <div className="flex gap-2 mt-6 pt-4 border-t border-primary/5">
                <button onClick={() => handleEditOpen(crop)} className="flex-1 btn btn-outline btn-sm gap-2 text-[10px] font-black uppercase tracking-widest"><Edit2 className="w-3 h-3" /> {t('edit_listing')}</button>
                <button onClick={() => handleDelete(crop._id)} className="btn btn-outline btn-sm text-danger hover:bg-danger hover:text-white border-danger/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-md p-8 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-heading font-black flex items-center gap-2"><Edit2 className="w-6 h-6 text-primary"/> {t('edit_listing_title') || 'Edit Listing'}</h2>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-bg rounded"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('crop_name')}</label>
                <input 
                  className={`w-full p-3 rounded-small border-2 ${errors.crop_name ? 'border-red-500' : 'border-primary/10'} font-bold outline-none focus:border-primary`}
                  value={editData.crop_name}
                  onChange={(e) => {
                    setEditData({...editData, crop_name: e.target.value});
                    if (errors.crop_name) setErrors({...errors, crop_name: null});
                  }}
                />
                {errors.crop_name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.crop_name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('quantity_label')}</label>
                  <input 
                    type="number"
                    className={`w-full p-3 rounded-small border-2 ${errors.quantity ? 'border-red-500' : 'border-primary/10'} font-bold outline-none focus:border-primary`}
                    value={editData.quantity}
                    onChange={(e) => {
                      setEditData({...editData, quantity: e.target.value, is_available: e.target.value > 0});
                      if (errors.quantity) setErrors({...errors, quantity: null});
                    }}
                  />
                  {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.quantity}</p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('price_per_unit') || 'Price / unit'}</label>
                  <input 
                    type="number"
                    className={`w-full p-3 rounded-small border-2 ${errors.price_per_unit ? 'border-red-500' : 'border-primary/10'} font-bold outline-none focus:border-primary`}
                    value={editData.price_per_unit}
                    onChange={(e) => {
                      setEditData({...editData, price_per_unit: e.target.value});
                      if (errors.price_per_unit) setErrors({...errors, price_per_unit: null});
                    }}
                  />
                  {errors.price_per_unit && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.price_per_unit}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('harvest_date_label') || 'Harvest Date'}</label>
                  <input 
                    type="date"
                    className={`w-full p-3 rounded-small border-2 ${errors.harvest_date ? 'border-red-500' : 'border-primary/10'} font-bold outline-none focus:border-primary text-sm`}
                    value={editData.harvest_date || ''}
                    onChange={(e) => {
                      setEditData({...editData, harvest_date: e.target.value});
                      if (errors.harvest_date) setErrors({...errors, harvest_date: null});
                    }}
                  />
                  {errors.harvest_date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.harvest_date}</p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-dark mb-2 block">{t('location')}</label>
                  <input 
                    className={`w-full p-3 rounded-small border-2 ${errors.location ? 'border-red-500' : 'border-primary/10'} font-bold outline-none focus:border-primary text-sm`}
                    value={editData.location || ''}
                    onChange={(e) => {
                      setEditData({...editData, location: e.target.value});
                      if (errors.location) setErrors({...errors, location: null});
                    }}
                  />
                  {errors.location && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.location}</p>}
                </div>
              </div>
              
              <div className="relative p-4 bg-primary/5 rounded-large border border-dashed border-primary/20 flex flex-col items-center gap-3 overflow-hidden group/img">
                 {editData.image_url ? (
                   <img src={editData.image_url} className="w-full h-32 object-cover rounded-md mb-2" />
                 ) : (
                   <ImageIcon className="w-8 h-8 text-primary opacity-40" />
                 )}
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">
                   {editData.image_url ? (t('change_photo') || 'Change Photo') : t('upload_photo_label')}
                 </span>
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="absolute inset-0 opacity-0 cursor-pointer" 
                   onChange={handleImageChange}
                 />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} className="flex-1 btn btn-outline py-4">{t('cancel') || 'Cancel'}</button>
              <button onClick={handleEditSave} className="flex-[2] btn btn-primary py-4 gap-2 font-black uppercase">
                <Save className="w-5 h-5"/> {t('save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
