import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Tag, ImageIcon, Send, ArrowLeft, Info, Calendar, MapPin } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';

const AddCrop = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');

  const [formData, setFormData] = useState({
    crop_name: '',
    custom_crop: '',
    quantity: '',
    unit: 'kg',
    price_per_unit: '',
    location: profile.location || '',
    harvest_date: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'
  });
  const [errors, setErrors] = useState({});

  const cropTypes = [
    "Ragi", "Jowar", "Paddy (Rice)", "Maize", "Sugarcane", "Cotton", 
    "Groundnut", "Toor Dal", "Coffee", "Arecanut", "Coconut", 
    "Turmeric", "Onion", "Tomato", "Chilli", "Sunflower", "Soybean", 
    "Bengal Gram (Chana)"
  ];

  const filteredCrops = cropTypes.filter(c => c.toLowerCase().includes((formData.crop_name || '').toLowerCase()));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file);
      setFormData({ ...formData, image_url: resized });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.crop_name || formData.crop_name.trim() === '') {
      newErrors.crop_name = t('err_enter_crop') || 'Crop name is required.';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = t('err_enter_qty') || 'Please enter a valid quantity.';
    }
    if (!formData.price_per_unit || Number(formData.price_per_unit) <= 0) {
      newErrors.price_per_unit = t('err_enter_price') || 'Please enter a valid price.';
    }
    if (!formData.location || formData.location.trim() === '') {
      newErrors.location = t('err_enter_location') || 'Location is required.';
    }
    if (!formData.harvest_date || formData.harvest_date === '') {
      newErrors.harvest_date = t('err_enter_date') || 'Harvest date is required.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    
    const cropData = {
      ...formData,
      crop_name: formData.crop_name,
      farmer_id: profile.id,
      farmer_name: profile.full_name || profile.name || 'Unknown Farmer',
      farmer_location: profile.location || formData.location,
      farmer_phone: profile.phone,
      harvest_date: formData.harvest_date || null,
      is_available: true
    };

    const res = await api.addCrop(cropData);
    setLoading(false);
    
    if (res.success) {
      showToast(t('success_label') + '! ' + (t('publish_btn') || 'Listing published.'), "success");
      navigate('/farmer-dash');
    } else {
      setErrors({ submit: res.error || (t('err_add_crop') || 'Failed to add crop') });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-dash" className="inline-flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest mb-6 hover:translate-x-1 transition-transform">
          <ArrowLeft className="w-4 h-4" /> {t('back_to_dashboard') || 'Back to Dashboard'}
        </Link>
        <div className="card p-8 shadow-hard">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('add_crop_title')}</h1>
            <p className="text-text-muted">{t('add_crop_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{t('crop_name')}</label>
                <div className="relative">
                  <Tag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input 
                    name="crop_name"
                    required
                    placeholder={t('crop_type_placeholder')}
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${errors.crop_name ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold bg-white`}
                    value={formData.crop_name}
                    onChange={(e) => {
                      handleChange(e);
                      setShowDropdown(true);
                      if (errors.crop_name) setErrors({...errors, crop_name: null});
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    autoComplete="off"
                  />
                  {errors.crop_name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.crop_name}</p>}
                  {showDropdown && filteredCrops.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-small border-2 border-primary/10 shadow-large overflow-hidden z-20 max-h-48 overflow-y-auto">
                      {filteredCrops.map(c => (
                        <div
                          key={c}
                          className="px-4 py-3 hover:bg-primary/5 cursor-pointer font-bold text-text-dark border-b border-gray-100 last:border-none"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, crop_name: c });
                            setShowDropdown(false);
                          }}
                        >
                          {t(`data.${c}`) !== `data.${c}` ? t(`data.${c}`) : c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{t('quantity_label')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Package className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                    <input 
                      name="quantity"
                      type="number"
                      required
                      placeholder={t('amount_placeholder') || "Amount"}
                      className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${errors.quantity ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
                      value={formData.quantity}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.quantity) setErrors({...errors, quantity: null});
                      }}
                    />
                  </div>
                  <select 
                    name="unit"
                    className="bg-bg border-2 border-primary/10 rounded-small px-4 font-bold outline-none focus:border-primary"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
                {errors.quantity && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{(t('price_per_unit') || 'Price per unit') + ' / ' + formData.unit}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 font-black">₹</span>
                  <input 
                    name="price_per_unit"
                    type="number"
                    required
                    placeholder={t('rate_per_unit_placeholder') || "Rate per unit"}
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${errors.price_per_unit ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-black text-primary`}
                    value={formData.price_per_unit}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.price_per_unit) setErrors({...errors, price_per_unit: null});
                    }}
                  />
                  {errors.price_per_unit && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.price_per_unit}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{t('harvest_date_label')}</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input 
                    name="harvest_date"
                    type="date"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${errors.harvest_date ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold text-sm`}
                    value={formData.harvest_date}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.harvest_date) setErrors({...errors, harvest_date: null});
                    }}
                  />
                </div>
                {errors.harvest_date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{errors.harvest_date}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{t('location')}</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input 
                    name="location"
                    required
                    placeholder={t('village_town_placeholder') || "Village / Town"}
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${errors.location ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
                    value={formData.location}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.location) setErrors({...errors, location: null});
                    }}
                  />
                  {errors.location && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{errors.location}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary-dark">{t('description_label')}</label>
              <textarea 
                name="description"
                placeholder={t('description_placeholder')}
                className="w-full p-4 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-medium h-24"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="relative p-4 bg-primary/5 rounded-large border border-dashed border-primary/20 flex flex-col items-center gap-3 overflow-hidden group/img min-h-[120px] justify-center">
               {formData.image_url && !formData.image_url.includes('unsplash') ? (
                 <img src={formData.image_url} className="w-full h-32 object-cover rounded-md mb-2" />
               ) : (
                 <ImageIcon className="w-8 h-8 text-primary opacity-40" />
               )}
               <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 text-center">
                 {formData.image_url && !formData.image_url.includes('unsplash') ? (t('change_photo') || 'Change Photo') : t('upload_photo_label')}
               </span>
               <input 
                 type="file" 
                 accept="image/*" 
                 className="absolute inset-0 opacity-0 cursor-pointer" 
                 onChange={handleImageChange}
               />
            </div>

            <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">{t('estimated_val')}</span>
                <span className="text-xl font-black text-primary-dark">₹{((formData.price_per_unit || 0) * (formData.quantity || 0)).toLocaleString()}</span>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary px-10 py-4 gap-2 font-black uppercase text-sm tracking-widest shadow-hard"
              >
                {loading ? (t('publishing') || 'Publishing...') : t('publish_btn')} <Send className="w-5 h-5" />
              </button>
            </div>
            {errors.submit && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-small flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <Info className="w-4 h-4" /> {errors.submit}
              </div>
            )}
          </form>
        </div>
        
        <div className="mt-8 flex items-start gap-4 p-4 bg-bg rounded-large border border-primary/5">
          <Info className="w-6 h-6 text-primary flex-shrink-0" />
          <p className="text-[10px] font-bold text-text-muted leading-tight">{t('add_crop_terms') || 'By publishing, you agree that your harvest listing is accurate. Agri-Mitra ensures fair trade, but false listings may lead to account suspension.'}</p>
        </div>
      </div>
    </div>
  );
};

export default AddCrop;
