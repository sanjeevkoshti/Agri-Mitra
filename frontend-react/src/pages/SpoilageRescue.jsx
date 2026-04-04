import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Phone, MapPin, Clock, ArrowRight, ShieldCheck,
  Heart, Package, Search, X, CheckCircle, Truck, User, Info,
  Plus, Trash2
} from 'lucide-react';

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
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    crop_name: '', quantity_kg: '', original_price_per_kg: '',
    discount_percent: 30, shelf_life_hours: 24, description: '',
  });

  const discountedPrice = form.original_price_per_kg
    ? (form.original_price_per_kg * (1 - form.discount_percent / 100)).toFixed(2)
    : '0.00';

  const fetchMine = async () => {
    setLoading(true);
    const res = await api.getSpoilageByFarmer(profile.id);
    if (res.success) setMyListings(res.data);
    setLoading(false);
  };

  useEffect(() => { if (profile.id) fetchMine(); }, [profile.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
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
    });
    setFormLoading(false);
    if (res.success) {
      setShowForm(false);
      setForm({ crop_name: '', quantity_kg: '', original_price_per_kg: '', discount_percent: 30, shelf_life_hours: 24, description: '' });
      setSuccessMsg('✅ Rescue listing posted! Retailers can see it immediately.');
      fetchMine();
      setTimeout(() => setSuccessMsg(''), 6000);
    } else {
      setFormErrors({ submit: res.error || 'Failed to post listing.' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this rescue listing?')) {
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
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <AlertTriangle className="w-40 h-40 absolute -right-6 -bottom-6 text-red-400 opacity-10 rotate-12" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <AlertTriangle className="w-3 h-3" /> Spoilage Rescue — Farmer Portal
          </div>
          <h1 className="text-4xl font-heading font-black text-green-900 uppercase tracking-tight mb-3">
            Report At-Risk Crops
          </h1>
          <p className="text-gray-600 text-base mb-6">
            If your crop is at risk of spoiling within the next 72 hours, list it here at a discount. Retailers get notified immediately and can place urgent orders.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowForm(true); setFormErrors({}); }}
              className="btn text-white font-black uppercase text-xs tracking-widest shadow-hard px-6 py-3 rounded-full flex items-center gap-2"
              style={{ backgroundColor: '#dc2626' }}
            >
              <Plus className="w-4 h-4" /> Report At-Risk Crop
            </button>
            <Link to="/farmer-dash" className="btn btn-outline border-green-700 text--800 font-black uppercase text-xs tracking-widest px-6 py-3 rounded-full">
              ← Back to Dashboard
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center py-5 border-2 border-red-100">
          <div className="text-3xl font-black text-red-600">{active.length}</div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Active Listings</div>
        </div>
        <div className="card text-center py-5 border-2 border-gray-100">
          <div className="text-3xl font-black text-gray-500">{past.filter(l=>l.status==='sold').length}</div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Sold via Rescue</div>
        </div>
        <div className="card text-center py-5 border-2 border-green-100">
          <div className="text-3xl font-black text-green-700">
            {active.reduce((s,l) => s + Number(l.quantity_kg || 0), 0).toLocaleString()} kg
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Qty Listed</div>
        </div>
      </div>

      {/* Active Listings */}
      <h2 className="text-xl font-heading font-black text-green-900 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-red-500" /> Active Rescue Listings
      </h2>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-bold text-sm">Loading your listings...</p>
        </div>
      ) : active.length === 0 ? (
        <div className="card text-center py-12 border-2 border-dashed border-red-200 bg-red-50 mb-8">
          <AlertTriangle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-500 mb-2">No active rescue listings</h3>
          <p className="text-sm text-gray-400 mb-4">Click "Report At-Risk Crop" above when you have produce at risk.</p>
          <button
            onClick={() => { setShowForm(true); setFormErrors({}); }}
            className="btn text-white font-black uppercase text-xs tracking-widest px-6 py-2.5 rounded-full inline-flex items-center gap-2"
            style={{ backgroundColor: '#dc2626' }}
          >
            <Plus className="w-3.5 h-3.5" /> Report Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {active.map(item => (
            <div key={item.id} className={`card border-l-4 ${urgencyBorder(item.shelf_life_hours)}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cropEmoji(item.crop_name)}</span>
                  <div>
                    <h3 className="text-lg font-black text-green-900">{item.crop_name}</h3>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.quantity_kg} kg</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-tighter">Active</span>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Rescue Price</span>
                  <span className="font-black text-green-800">₹{item.discounted_price_per_kg}/kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Discount</span>
                  <span className="font-black text-red-600">{item.discount_percent}% OFF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold">Original</span>
                  <span className="text-gray-400 line-through font-bold">₹{item.original_price_per_kg}/kg</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                  <span className={`font-black flex items-center gap-1 ${urgencyText(item.shelf_life_hours)}`}>
                    <Clock className="w-3 h-3" /> {item.shelf_life_hours}h shelf life
                  </span>
                  <span className="text-gray-400 text-xs font-bold">
                    {new Date(item.created_at).toLocaleDateString('en-IN')}
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
                  <CheckCircle className="w-3 h-3" /> Mark Sold
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
            Past Rescue Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {past.map(item => (
              <div key={item.id} className="card border-l-4 border-l-gray-300 opacity-60">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cropEmoji(item.crop_name)}</span>
                    <h3 className="font-black text-gray-700">{item.crop_name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {item.status === 'sold' ? '✓ Sold' : 'Expired'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-bold">{item.quantity_kg} kg · ₹{item.discounted_price_per_kg}/kg · {item.discount_percent}% off</div>
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
                  <AlertTriangle className="w-2.5 h-2.5" /> Rescue Listing
                </div>
                <h2 className="text-2xl font-heading font-black text-green-900">Report At-Risk Crop</h2>
                <p className="text-sm text-gray-500 mt-1">Visible to retailers immediately after posting.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Crop Name</label>
                <input name="crop_name"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.crop_name ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  placeholder="e.g. Tomato, Onion, Cabbage…"
                  value={form.crop_name} onChange={handleChange}
                />
                {formErrors.crop_name && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.crop_name}</p>}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Quantity (kg)</label>
                <input name="quantity_kg" type="number" min="1"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.quantity_kg ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  placeholder="Amount in kg"
                  value={form.quantity_kg} onChange={handleChange}
                />
                {formErrors.quantity_kg && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.quantity_kg}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Original Price/kg (₹)</label>
                  <input name="original_price_per_kg" type="number" min="1"
                    className={`w-full p-3 rounded-xl border-2 ${formErrors.original_price_per_kg ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                    placeholder="₹"
                    value={form.original_price_per_kg} onChange={handleChange}
                  />
                  {formErrors.original_price_per_kg && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.original_price_per_kg}</p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Discount</label>
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
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rescue Price</div>
                  <div className="text-2xl font-black text-green-800">₹{discountedPrice}/kg</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-red-600">{form.discount_percent}% OFF</div>
                  <div className="text-xs text-gray-400 line-through font-bold">₹{form.original_price_per_kg || '0'}/kg</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">
                  Shelf Life Remaining (hours, max 72)
                </label>
                <input name="shelf_life_hours" type="number" min="1" max="72"
                  className={`w-full p-3 rounded-xl border-2 ${formErrors.shelf_life_hours ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-red-500 transition-all`}
                  placeholder="e.g. 24"
                  value={form.shelf_life_hours} onChange={handleChange}
                />
                {formErrors.shelf_life_hours && <p className="text-red-500 text-[10px] font-bold mt-1">{formErrors.shelf_life_hours}</p>}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Notes (optional)</label>
                <textarea name="description"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 font-medium outline-none focus:border-red-500 transition-all h-20"
                  placeholder="Produce condition, storage, urgent pickup details…"
                  value={form.description} onChange={handleChange}
                />
              </div>
            </div>

            {formErrors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
                <Info className="w-4 h-4 flex-shrink-0" /> {formErrors.submit}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 btn btn-outline py-4">Cancel</button>
              <button
                onClick={handleSubmit} disabled={formLoading}
                className="flex-[2] py-4 gap-2 font-black text-sm btn text-white flex items-center justify-center"
                style={{ backgroundColor: '#dc2626' }}
              >
                {formLoading ? 'Posting…' : 'Post Rescue Listing'} <AlertTriangle className="w-4 h-4" />
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
            <AlertTriangle className="w-3 h-3" /> Urgent Response Required
          </div>
          <h1 className="text-4xl font-heading font-black text-green-900 uppercase tracking-tight mb-3">
            Spoilage Rescue Network
          </h1>
          <p className="text-gray-600 text-base mb-6">
            Rescue fresh produce at steep discounts before it's lost. Every purchase saves a farmer from total loss.
          </p>
          <div className="flex flex-wrap gap-6 mb-6">
            {[
              { val: stats.total, label: 'Active Rescues', color: 'text-green-800' },
              { val: stats.critical, label: 'Critical (≤12h)', color: 'text-red-600' },
              { val: `${stats.totalKg.toLocaleString()} kg`, label: 'Total Available', color: 'text-orange-600' },
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
              placeholder="Search by crop name…"
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
            <Clock className="w-6 h-6 text-red-500" /> Urgent Rescue Listings
          </h2>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-500">Scanning for rescue listings…</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="card py-20 text-center border-2 border-dashed border-red-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">No active rescue listings</h3>
              <p className="text-gray-400 text-sm">
                {search ? `Nothing matches "${search}"` : 'Farmers post here when crops are at risk. Check back soon.'}
              </p>
              {search && <button onClick={() => setSearch('')} className="btn btn-primary mt-4 rounded-full px-6">Clear Search</button>}
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map(item => (
                <div key={item.id} className={`card border-l-4 ${urgencyBorder(item.shelf_life_hours)} hover:shadow-hard transition-all group`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-red-100">
                        {cropEmoji(item.crop_name)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-green-900">{item.crop_name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {item.quantity_kg} kg</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.farmer_location || 'N/A'}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.farmer_name || 'Farmer'}</span>
                        </div>
                        {item.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-5 justify-between md:justify-end flex-shrink-0">
                      <div className="text-right">
                        <div className={`font-black text-xl ${urgencyText(item.shelf_life_hours)}`}>{item.discount_percent}% OFF</div>
                        <div className="text-green-800 font-black">₹{item.discounted_price_per_kg}/kg</div>
                        <div className="text-gray-400 text-xs line-through font-bold">₹{item.original_price_per_kg}/kg</div>
                        <div className={`text-[10px] font-black flex items-center gap-1 justify-end mt-1 ${urgencyText(item.shelf_life_hours)}`}>
                          <Clock className="w-3 h-3" /> {item.shelf_life_hours}h left
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => { setOrderModal(item); setOrderQty(1); setErrors({}); }}
                          className="btn btn-primary btn-sm px-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-hard"
                        >
                          Rescue Now
                        </button>
                        <button
                          onClick={() => setContactModal(item)}
                          className="btn btn-outline btn-sm px-5 rounded-full font-black uppercase text-[10px] tracking-widest border-green-700 text-green-700 hover:bg-green-700 hover:text-white flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Contact
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
              <ShieldCheck className="w-5 h-5 text-yellow-400" /> Rescue Rules
            </h3>
            <ul className="space-y-4 text-sm font-medium text-green-200">
              {[
                'Listed only if ≤ 72 hours of shelf life remain.',
                'Minimum 20% discount on all rescue listings.',
                'Verified logistics prioritise rescue pickups.',
                'Payment via UPI before pickup for farmer security.',
              ].map(rule => (
                <li key={rule} className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /> {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-2 border-gray-100 p-6">
            <h3 className="font-black uppercase text-xs tracking-widest text-green-900 mb-4">Urgency Scale</h3>
            {[
              { dot: 'bg-red-600', label: '≤ 12 hours', tag: 'Critical', tagColor: 'text-red-600' },
              { dot: 'bg-orange-500', label: '13–24 hours', tag: 'High Risk', tagColor: 'text-orange-500' },
              { dot: 'bg-yellow-500', label: '25–72 hours', tag: 'Moderate', tagColor: 'text-yellow-600' },
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
              <h3 className="font-black uppercase text-xs tracking-widest text-green-900">Social Impact</h3>
            </div>
            <p className="text-xs font-bold text-green-800 leading-relaxed">
              The Spoilage Rescue Network has prevented over 450 tons of food waste this year, saving farmers from total financial loss.
            </p>
            <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Rescue Hotline</span>
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
                  <AlertTriangle className="w-2.5 h-2.5" /> Rescue Order
                </div>
                <h2 className="text-2xl font-heading font-black text-green-900">{orderModal.crop_name}</h2>
              </div>
              <button onClick={() => setOrderModal(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex justify-between items-center bg-red-50 rounded-xl p-4 mb-6 border border-red-100">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rescue Price</div>
                <div className="text-2xl font-black text-green-800">₹{orderModal.discounted_price_per_kg}/kg</div>
                <div className="text-xs text-gray-400 line-through font-bold">₹{orderModal.original_price_per_kg}/kg</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-red-600">{orderModal.discount_percent}% OFF</div>
                <div className={`text-xs font-black flex items-center gap-1 justify-end mt-1 ${urgencyText(orderModal.shelf_life_hours)}`}>
                  <Clock className="w-3 h-3" /> {orderModal.shelf_life_hours}h shelf life
                </div>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Quantity (kg)</label>
                <input type="number" min="1" max={orderModal.quantity_kg}
                  className={`w-full p-3 rounded-xl border-2 ${errors.quantity ? 'border-red-500' : 'border-gray-200'} font-bold outline-none focus:border-green-600`}
                  value={orderQty} onChange={e => { setOrderQty(e.target.value); setErrors({...errors, quantity: null}); }}
                />
                {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.quantity}</p>}
                <p className="text-[10px] text-gray-400 font-bold mt-1">Available: {orderModal.quantity_kg} kg</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 block">Delivery Address</label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <textarea
                    className={`w-full pl-10 pr-3 py-3 rounded-xl border-2 ${errors.address ? 'border-red-500' : 'border-gray-200'} font-medium outline-none focus:border-green-600 h-20`}
                    placeholder="Enter full delivery address…"
                    value={deliveryAddress} onChange={e => { setDeliveryAddress(e.target.value); setErrors({...errors, address: null}); }}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.address}</p>}
              </div>
            </div>
            <div className="flex justify-between items-center mb-5 px-1">
              <span className="font-bold text-gray-500">Total Rescue Cost</span>
              <span className="text-3xl font-black text-green-800">₹{(orderModal.discounted_price_per_kg * orderQty).toLocaleString()}</span>
            </div>
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
                <Info className="w-4 h-4 flex-shrink-0" /> {errors.submit}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setOrderModal(null)} className="flex-1 btn btn-outline py-3">Cancel</button>
              <button onClick={handleOrder} disabled={orderLoading} className="flex-[2] btn btn-primary py-3 gap-2 font-black text-sm">
                {orderLoading ? 'Placing…' : 'Confirm Rescue'} <CheckCircle className="w-4 h-4" />
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
              <h2 className="text-xl font-heading font-black text-green-900">Farmer Contact</h2>
              <button onClick={() => setContactModal(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              {[
                { icon: <User className="w-6 h-6" />, bg: 'bg-green-100 text-green-700', label: 'Farmer', val: contactModal.farmer_name || 'Not provided' },
                { icon: <Phone className="w-6 h-6" />, bg: 'bg-yellow-100 text-yellow-700', label: 'Phone', val: contactModal.farmer_phone || 'Hidden' },
                { icon: <MapPin className="w-6 h-6" />, bg: 'bg-blue-100 text-blue-700', label: 'Location', val: contactModal.farmer_location || 'Not specified' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${row.bg} flex items-center justify-center`}>{row.icon}</div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</div>
                    <div className="font-black text-lg text-green-900">{row.val}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t">
              <a href={`tel:${contactModal.farmer_phone}`}
                className={`w-full btn py-4 gap-2 flex items-center justify-center font-black ${contactModal.farmer_phone ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                onClick={e => !contactModal.farmer_phone && e.preventDefault()}
              >
                <Phone className="w-5 h-5" /> Call Farmer Now
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
  if (profile.role === 'farmer') return <FarmerView profile={profile} />;
  return <RetailerView profile={profile} />;
};

export default SpoilageRescue;
