import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Plus, Trash2, AlertTriangle, CheckCircle, Clock, X, 
  Truck, Info, User, Phone, MapPin, Package, Search,
  ShieldCheck, ArrowRight, Heart
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';

/* ─── helpers ─── */
const urgencyBorder = (h) => h <= 12 ? 'border-l-red-600' : h <= 24 ? 'border-l-orange-500' : 'border-l-yellow-500';
const urgencyText   = (h) => h <= 12 ? 'text-red-600'    : h <= 24 ? 'text-orange-500'    : 'text-yellow-600';
const cropEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('tomato'))  return '🍅';
  if (n.includes('onion'))   return '🧅';
  if (n.includes('cabbage')) return '🥬';
  if (n.includes('potato'))  return '🥔';
  if (n.includes('banana'))  return '🍌';
  if (n.includes('mango'))   return '🥭';
  if (n.includes('spinach') || n.includes('leafy')) return '🌿';
  if (n.includes('carrot'))  return '🥕';
  if (n.includes('grape'))   return '🍇';
  return '🌾';
};

/* ════════════════════════════════════════════════
   FARMER VIEW — their own rescue listings + form
   ════════════════════════════════════════════════ */
const FarmerView = ({ profile }) => {
  const { t } = useI18n();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    crop_name: '', quantity_kg: '', original_price_per_kg: '',
    discount_percent: 30, shelf_life_hours: 24, description: '', image_url: null
  });

  const discountedPrice = form.original_price_per_kg
    ? (form.original_price_per_kg * (1 - form.discount_percent / 100)).toFixed(2)
    : '0.00';

  const fetchMine = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await api.getSpoilageByFarmer(profile.id);
    if (res.success) {
      setMyListings(res.data);
    } else {
      setErrorMsg(res.error || t('err_fetch'));
    }
    setLoading(false);
  };

  useEffect(() => { if (profile.id) fetchMine(); }, [profile.id]);

  const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (file) {
        const resized = await resizeImage(file);
        setForm(p => ({ ...p, image_url: resized }));
      }
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: null }));
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.crop_name.trim())                       errs.crop_name = 'Required';
    if (!form.quantity_kg || Number(form.quantity_kg) <= 0) errs.quantity_kg = 'Enter valid qty';
    if (!form.original_price_per_kg || Number(form.original_price_per_kg) <= 0) errs.original_price_per_kg = 'Enter price';
    if (Number(form.discount_percent) < 20)           errs.discount_percent = 'Min 20% required';
    if (Number(form.shelf_life_hours) > 72)           errs.shelf_life_hours = 'Max 72 hours';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setFormLoading(true);
    const res = await api.addSpoilageListing({
      farmer_id: profile.id,
      farmer_name: profile.full_name || profile.name,
      farmer_phone: profile.phone,
      farmer_location: profile.location,
      crop_name: form.crop_name,
      quantity_kg: Number(form.quantity_kg),
      original_price_per_kg: Number(form.original_price_per_kg),
      discounted_price_per_kg: Number(discountedPrice),
      discount_percent: Number(form.discount_percent),
      shelf_life_hours: Number(form.shelf_life_hours),
      description: form.description,
      image_url: form.image_url
    });
    setFormLoading(false);
    if (res.success) {
      setShowForm(false);
      setForm({ crop_name: '', quantity_kg: '', original_price_per_kg: '', discount_percent: 30, shelf_life_hours: 24, description: '', image_url: null });
      setSuccessMsg(t('rescue_msg'));
      fetchMine();
      setTimeout(() => setSuccessMsg(''), 6000);
    } else {
      setFormErrors({ submit: res.error || t('err_update') });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('delete') + '?')) {
      await api.deleteSpoilageListing(id);
      fetchMine();
    }
  };

  const handleMarkSold = async (id) => {
    await api.updateSpoilageListing(id, { status: 'sold', is_available: false });
    fetchMine();
  };

  const active = myListings.filter(l => l.status === 'active');
  const past   = myListings.filter(l => l.status !== 'active');

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
        <AlertTriangle className="w-40 h-40 absolute -right-6 -bottom-6 text-red-400 opacity-10 rotate-12" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <AlertTriangle className="w-3 h-3" /> {t('spoilage_rescue')} — {t('farmer')}
          </div>
          <h1 className="text-2xl md:text-4xl font-heading font-black text-green-900 uppercase tracking-tight mb-3">
            {t('report_at_risk_title')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-6">
            {t('rescue_portal_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setShowForm(true); setFormErrors({}); }}
              className="w-full sm:w-auto btn text-white font-black uppercase text-xs tracking-widest shadow-hard px-6 py-3 rounded-full flex items-center justify-center gap-2"
              style={{ backgroundColor: '#dc2626' }}
            >
              <Plus className="w-4 h-4" /> {t('report_at_risk')}
            </button>
            <Link to="/farmer-dash" className="w-full sm:w-auto btn btn-outline border-green-700 text-green-800 font-black uppercase text-xs tracking-widest px-6 py-3 rounded-full flex items-center justify-center">
              ← {t('back_to_dashboard')}
            </Link>
          </div>
        </div>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 font-bold text-sm">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" /> {errorMsg}
          <button onClick={fetchMine} className="ml-auto text-[10px] uppercase font-black underline">{t('retry') || 'Retry'}</button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center py-5 border-2 border-red-100 bg-white rounded-2xl shadow-sm">
          <div className="text-3xl font-black text-red-600">{active.length}</div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{t('rescue_stats_active')}</div>
        </div>
        <div className="card text-center py-5 border-2 border-gray-100 bg-white rounded-2xl shadow-sm">
          <div className="text-3xl font-black text-gray-500">{past.filter(l=>l.status==='sold').length}</div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{t('rescue_stats_sold')}</div>
        </div>
        <div className="card text-center py-5 border-2 border-green-100 bg-white rounded-2xl shadow-sm">
          <div className="text-3xl font-black text-green-700">
            {active.reduce((s,l) => s + Number(l.quantity_kg || 0), 0).toLocaleString()} kg
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{t('rescue_stats_qty')}</div>
        </div>
      </div>

      {/* Active Listings */}
      <h2 className="text-xl font-heading font-black text-green-900 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-red-500" /> {t('active_listings')}
      </h2>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-bold text-sm">{t('loading_listings') || 'Loading...'}</p>
        </div>
      ) : active.length === 0 ? (
        <div className="card text-center py-12 border-2 border-dashed border-red-200 bg-red-50 mb-8">
          <AlertTriangle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-500 mb-2">{t('no_rescue_desc')}</h3>
          <button
            onClick={() => { setShowForm(true); setFormErrors({}); }}
            className="btn text-white font-black uppercase text-xs tracking-widest px-6 py-2.5 rounded-full inline-flex items-center gap-2"
            style={{ backgroundColor: '#dc2626' }}
          >
            <Plus className="w-3.5 h-3.5" /> {t('report_at_risk')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {active.map(item => (
              <div key={item.id} className={`card border-l-4 ${urgencyBorder(item.shelf_life_hours)} p-4`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-red-100 overflow-hidden shadow-sm">
                      {item.image_url ? <img src={item.image_url} alt={item.crop_name} className="w-full h-full object-cover" /> : cropEmoji(item.crop_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-green-900 leading-tight">
                        {t(`data.${item.crop_name}`) !== `data.${item.crop_name}` ? t(`data.${item.crop_name}`) : item.crop_name}
                      </h3>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.quantity_kg} kg</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-tighter">{t('status_active')}</span>
                </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">{t('rescue_price_label')}</span>
                  <span className="font-black text-green-800">₹{item.discounted_price_per_kg}/kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">{t('discount')}</span>
                  <span className="font-black text-red-600">{item.discount_percent}% OFF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold">{t('original')}</span>
                  <span className="text-gray-400 line-through font-bold">₹{item.original_price_per_kg}/kg</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                  <span className={`font-black flex items-center gap-1 ${urgencyText(item.shelf_life_hours)}`}>
                    <Clock className="w-3 h-3" /> {item.shelf_life_hours}h {t('remaining')}
                  </span>
                  <span className="text-gray-400 text-xs font-bold">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-gray-400 font-medium mb-3 line-clamp-2">{item.description}</p>
              )}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleMarkSold(item.id)}
                  className="flex-1 btn btn-outline btn-sm text-[10px] font-black uppercase tracking-widest text-green-700 border-green-300 hover:bg-green-700 hover:text-white flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> {t('mark_sold')}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn btn-outline btn-sm text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Listings */}
      {past.length > 0 && (
        <>
          <h2 className="text-lg font-heading font-black text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            {t('past_rescues') || 'Past Rescues'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {past.map(item => (
              <div key={item.id} className="card border-l-4 border-l-gray-300 opacity-70 p-3 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border border-gray-100 overflow-hidden grayscale">
                      {item.image_url ? <img src={item.image_url} alt={item.crop_name} className="w-full h-full object-cover" /> : cropEmoji(item.crop_name)}
                    </div>
                    <h3 className="font-black text-gray-700">
                       {t(`data.${item.crop_name}`) !== `data.${item.crop_name}` ? t(`data.${item.crop_name}`) : item.crop_name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {item.status === 'sold' ? t('done') : t('expired') || 'Expired'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-bold">{item.quantity_kg} kg · ₹{item.discounted_price_per_kg}/kg · {item.discount_percent}% {t('discount')}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- REPORT FORM MODAL --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-lg p-8 animate-in slide-in-from-bottom-5 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-2.5 h-2.5" /> {t('spoilage_rescue')}
                </div>
                <h2 className="text-2xl font-heading font-black text-green-900">{t('report_at_risk_title')}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('crop_name')}</label>
                <input name="crop_name"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.crop_name ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  placeholder="e.g. Tomato, Onion..."
                  value={form.crop_name} onChange={handleChange}
                />
                {formErrors.crop_name && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.crop_name}</p>}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('quantity_label')}</label>
                <input name="quantity_kg" type="number" min="1"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.quantity_kg ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  placeholder="kg"
                  value={form.quantity_kg} onChange={handleChange}
                />
                {formErrors.quantity_kg && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.quantity_kg}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('original')} (₹/kg)</label>
                  <input name="original_price_per_kg" type="number" min="1"
                    className={`w-full p-3 rounded-xl border-2 ${formErrors.original_price_per_kg ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                    placeholder="₹"
                    value={form.original_price_per_kg} onChange={handleChange}
                  />
                  {formErrors.original_price_per_kg && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.original_price_per_kg}</p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('discount')}</label>
                  <select name="discount_percent"
                    className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold outline-none focus:border-red-500 transition-all bg-white"
                    value={form.discount_percent} onChange={handleChange}
                  >
                    {[20,25,30,35,40,45,50,60,70].map(d => (
                      <option key={d} value={d}>{d}% OFF</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live price preview */}
              <div className="flex items-center justify-between bg-red-50 rounded-xl p-4 border border-red-100">
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('rescue_price_label')}</div>
                  <div className="text-2xl font-black text-green-800">₹{discountedPrice}/kg</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-red-600">{form.discount_percent}% OFF</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">
                  {t('shelf_life_hours_label')}
                </label>
                <input name="shelf_life_hours" type="number" min="1" max="72"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.shelf_life_hours ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  value={form.shelf_life_hours} onChange={handleChange}
                />
                {formErrors.shelf_life_hours && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.shelf_life_hours}</p>}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('notes_label')}</label>
                <textarea name="description"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 font-medium outline-none focus:border-red-500 transition-all h-20"
                  placeholder={t('notes_placeholder')}
                  value={form.description} onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('image_upload_label') || 'Upload Condition Photo'}</label>
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {form.image_url ? <img src={form.image_url} alt="Crop" className="w-full h-full object-cover" /> : <Plus className="text-gray-400" />}
                  </div>
                  <input type="file" name="image" accept="image/*" 
                    onChange={handleChange}
                    className="text-xs font-bold text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 btn btn-outline py-4">{t('cancel')}</button>
              <button
                onClick={handleSubmit} disabled={formLoading}
                className="flex-[2] py-4 gap-2 font-black text-sm btn text-white flex items-center justify-center"
                style={{ backgroundColor: '#dc2626' }}
              >
                {formLoading ? t('posting') : t('list_rescue')} <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   RETAILER VIEW — browse & buy rescue listings
   ════════════════════════════════════════════════ */
const RetailerView = ({ profile }) => {
  const { t } = useI18n();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState(profile.location || '');
  const [orderLoading, setOrderLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    const res = await api.getSpoilageListings(search);
    if (res.success) setListings(res.data);
    setLoading(false);
  };

  useEffect(() => { const t = setTimeout(fetchListings, 300); return () => clearTimeout(t); }, [search]);

  const handleOrder = async () => {
    const errs = {};
    if (!deliveryAddress.trim()) errs.address = 'Delivery address is required.';
    const qty = Number(orderQty);
    if (qty <= 0) errs.quantity = 'Min 1 kg.';
    else if (qty > orderModal.quantity_kg) errs.quantity = `Only ${orderModal.quantity_kg} kg available.`;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setOrderLoading(true);

    const res = await api.placeOrder({
      farmer_id: orderModal.farmer_id,
      retailer_id: profile.id,
      retailer_name: profile.full_name || profile.name,
      retailer_phone: profile.phone,
      crop_id: null,
      crop_name: `[RESCUE] ${orderModal.crop_name}`,
      image_url: orderModal.image_url,
      quantity_kg: qty,
      price_per_kg: orderModal.discounted_price_per_kg,
      pickup_location: orderModal.farmer_location,
      delivery_address: deliveryAddress,
    });

    if (res.success) {
      if (qty >= orderModal.quantity_kg) {
        await api.updateSpoilageListing(orderModal.id, { status: 'sold', is_available: false });
      }
      setSuccessMsg('✅ Rescue order placed! The farmer will be notified immediately.');
      setOrderModal(null);
      fetchListings();
      setTimeout(() => setSuccessMsg(''), 6000);
    } else {
      setErrors({ submit: res.error || 'Failed to place order.' });
    }
    setOrderLoading(false);
  };

  const stats = {
    total: listings.length,
    critical: listings.filter(l => l.shelf_life_hours <= 12).length,
    totalKg: listings.reduce((s, l) => s + Number(l.quantity_kg || 0), 0),
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-10 relative overflow-hidden">
        <AlertTriangle className="w-40 h-40 absolute -right-6 -bottom-6 text-red-400 opacity-10 rotate-12" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <AlertTriangle className="w-3 h-3" /> {t('urgency_high')}
          </div>
          <h1 className="text-4xl font-heading font-black text-green-900 uppercase tracking-tight mb-3">
            {t('spoilage_rescue')}
          </h1>
          <p className="text-gray-600 text-base mb-6">
            {t('spoilage_rescue_desc')}
          </p>
          <div className="flex flex-wrap gap-6 mb-6">
            {[
              { val: stats.total, label: t('rescue_stats_active'), color: 'text-green-800' },
              { val: stats.critical, label: t('urgency_critical'), color: 'text-red-600' },
              { val: `${stats.totalKg.toLocaleString()} kg`, label: t('available'), color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-full border-2 border-red-200 focus:border-red-500 outline-none text-sm font-medium bg-white"
              placeholder={t('search_placeholder')}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 font-bold text-sm">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Listings column */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-heading font-black text-green-900 uppercase tracking-wide mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-red-500" /> {t('active_listings')}
          </h2>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-500">{t('scanning_rescue')}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="card py-20 text-center border-2 border-dashed border-red-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">{t('no_rescue_desc')}</h3>
              {search && <button onClick={() => setSearch('')} className="btn btn-primary mt-4 rounded-full px-6">{t('clear_btn')}</button>}
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map(item => (
                <div key={item.id} className={`card border-l-4 ${urgencyBorder(item.shelf_life_hours)} hover:shadow-hard transition-all group`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform border-2 border-red-100 overflow-hidden shadow-sm">
                        {item.image_url ? <img src={item.image_url} alt={item.crop_name} className="w-full h-full object-cover" /> : cropEmoji(item.crop_name)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-green-900">
                          {t(`data.${item.crop_name}`) !== `data.${item.crop_name}` ? t(`data.${item.crop_name}`) : item.crop_name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {item.quantity_kg} kg</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.farmer_location || t('na')}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.farmer_name || t('farmer')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 justify-between md:justify-end flex-shrink-0">
                      <div className="text-right">
                        <div className={`font-black text-xl ${urgencyText(item.shelf_life_hours)}`}>{item.discount_percent}% OFF</div>
                        <div className="text-green-800 font-black">₹{item.discounted_price_per_kg}/kg</div>
                        <div className={`text-[10px] font-black flex items-center gap-1 justify-end mt-1 ${urgencyText(item.shelf_life_hours)}`}>
                          <Clock className="w-3 h-3" /> {item.shelf_life_hours}h {t('remaining')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => { setOrderModal(item); setOrderQty(1); setErrors({}); }}
                          className="btn btn-primary btn-sm px-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-hard"
                        >
                          {t('rescue')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card bg-green-900 text-white p-6 shadow-hard">
            <h3 className="font-heading font-black text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-400" /> {t('rescue_rules')}
            </h3>
            <ul className="space-y-4 text-sm font-medium text-green-200">
              {[t('rescue_rule_1'), t('rescue_rule_2'), t('rescue_rule_3'), t('rescue_rule_4')].map(rule => (
                <li key={rule} className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /> {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-2 border-gray-100 p-6">
            <h3 className="font-black uppercase text-xs tracking-widest text-green-900 mb-4">{t('urgency_scale')}</h3>
            {[
              { dot: 'bg-red-600', label: `≤ 12 ${t('remaining')}`, tag: t('urgency_critical'), tagColor: 'text-red-600' },
              { dot: 'bg-orange-500', label: `13–24 ${t('remaining')}`, tag: t('urgency_high'), tagColor: 'text-orange-500' },
              { dot: 'bg-yellow-500', label: `25–72 ${t('remaining')}`, tag: t('urgency_mod'), tagColor: 'text-yellow-600' },
            ].map(u => (
              <div key={u.label} className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${u.dot} flex-shrink-0`} />
                <span className="text-sm font-bold text-gray-700">{u.label} — <span className={u.tagColor}>{u.tag}</span></span>
              </div>
            ))}
          </div>
          <div className="card border-2 border-green-100 p-6 bg-green-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-full"><Heart className="w-5 h-5 text-green-700" /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-green-900">{t('social_impact_title')}</h3>
            </div>
            <p className="text-xs font-bold text-green-800 leading-relaxed">
              {t('social_impact_desc')}
            </p>
            <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('rescue_hotline')}</span>
              <span className="font-black text-green-800 flex items-center gap-1 text-sm"><Phone className="w-3 h-3" /> 1800-RESCUE-MC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-md p-8 animate-in slide-in-from-bottom-5 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-2.5 h-2.5" /> {t('rescue_order_title')}
                </div>
                <h2 className="text-2xl font-heading font-black text-green-900">
                  {t(`data.${orderModal.crop_name}`) !== `data.${orderModal.crop_name}` ? t(`data.${orderModal.crop_name}`) : orderModal.crop_name}
                </h2>
              </div>
              <button onClick={() => setOrderModal(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex justify-between items-center bg-red-50 rounded-xl p-4 mb-6 border border-red-100">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{t('rescue_price_label')}</div>
                <div className="text-2xl font-black text-green-800">₹{orderModal.discounted_price_per_kg}/kg</div>
                <div className="text-xs text-gray-400 line-through font-bold">₹{orderModal.original_price_per_kg}/kg</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-red-600">{orderModal.discount_percent}% OFF</div>
                <div className={`text-xs font-black flex items-center gap-1 justify-end mt-1 ${urgencyText(orderModal.shelf_life_hours)}`}>
                  <Clock className="w-3 h-3" /> {orderModal.shelf_life_hours}h {t('remaining')}
                </div>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('quantity_label')}</label>
                <input type="number" min="1" max={orderModal.quantity_kg}
                  className={`w-full p-3 rounded-xl border-2 ${errors.quantity ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-green-600`}
                  value={orderQty} onChange={e => { setOrderQty(e.target.value); setErrors({...errors, quantity: null}); }}
                />
                {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.quantity}</p>}
                <p className="text-[10px] text-gray-400 font-bold mt-1">{t('available') || 'Available'}: {orderModal.quantity_kg} kg</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">{t('delivery_address_label')}</label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <textarea
                    className={`w-full pl-10 pr-3 py-3 rounded-xl border-2 ${errors.address ? 'border-red-500' : 'border-gray-200'} font-medium outline-none focus:border-green-600 h-20`}
                    placeholder={t('delivery_address_placeholder')}
                    value={deliveryAddress} onChange={e => { setDeliveryAddress(e.target.value); setErrors({...errors, address: null}); }}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.address}</p>}
              </div>
            </div>
            <div className="flex justify-between items-center mb-5 px-1">
              <span className="font-bold text-gray-500">{t('total_cost_label')}</span>
              <span className="text-3xl font-black text-green-800">₹{(orderModal.discounted_price_per_kg * orderQty).toLocaleString()}</span>
            </div>
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
                <Info className="w-4 h-4 flex-shrink-0" /> {errors.submit}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setOrderModal(null)} className="flex-1 btn btn-outline py-3">{t('cancel')}</button>
              <button onClick={handleOrder} disabled={orderLoading} className="flex-[2] btn btn-primary py-3 gap-2 font-black text-sm">
                {orderLoading ? t('placing') : t('confirm_rescue')} <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="card bg-white w-full max-w-sm p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-heading font-black text-green-900">{t('farmer_contact_info')}</h2>
              <button onClick={() => setContactModal(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              {[
                { icon: <User className="w-6 h-6" />, bg: 'bg-green-100 text-green-700', label: t('farmer'), val: contactModal.farmer_name || t('name_not_provided') },
                { icon: <Phone className="w-6 h-6" />, bg: 'bg-yellow-100 text-yellow-700', label: t('phone'), val: contactModal.farmer_phone || t('number_hidden') },
                { icon: <MapPin className="w-6 h-6" />, bg: 'bg-blue-100 text-blue-700', label: t('location'), val: contactModal.farmer_location || t('location_not_specified') },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${row.bg} flex items-center justify-center`}>{row.icon}</div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</div>
                    <div className="font-black text-lg text-green-900 truncate">{row.val}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t">
              <a href={`tel:${contactModal.farmer_phone}`}
                className={`w-full btn py-4 gap-2 flex items-center justify-center font-black ${contactModal.farmer_phone ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                onClick={e => !contactModal.farmer_phone && e.preventDefault()}
              >
                <Phone className="w-5 h-5" /> {t('call_farmer')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   ROOT — picks correct view based on role
   ════════════════════════════════════════════════ */
const SpoilageRescue = () => {
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');
  const role = (profile.role || '').toLowerCase();
  
  if (role === 'farmer') return <FarmerView profile={profile} />;
  return <RetailerView profile={profile} />;
};

export default SpoilageRescue;
