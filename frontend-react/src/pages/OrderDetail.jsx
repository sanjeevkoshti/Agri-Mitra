import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Package, Clock, Truck, CheckCircle, CreditCard, ArrowLeft, 
  ShieldCheck, Info, Smartphone, QrCode, MapPin, Calendar, 
  Trash2, AlertCircle, TrendingUp, User, ShoppingBag, X
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verificationMode, setVerificationMode] = useState('otp');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  // Counter Offer states
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterQty, setCounterQty] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterErrors, setCounterErrors] = useState({});
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Manual OTP Generation state
  const [generatingOTP, setGeneratingOTP] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState('otp'); // 'otp' or 'qr'

  // Focus the OTP input whenever we switch to (or open in) OTP mode
  useEffect(() => {
    if (verificationMode === 'otp' && showOtpModal) {
      // Small delay so the div has time to become visible via display:block
      const t = setTimeout(() => otpInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [verificationMode, showOtpModal]);

  // Reset modal state cleanly each time it opens
  useEffect(() => {
    if (showOtpModal) {
      setOtpInput('');
      setOtpError('');
      setVerificationMode('otp');
    }
  }, [showOtpModal]);

  const fetchOrder = async () => {
    setLoading(true);
    const res = await api.getOrder(orderId);
    if (res.success) {
      setOrder(res.data);
    } else {
      setError(res.error || 'Failed to fetch order details');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const askConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleGenerateOTP = async (method = 'otp') => {
    setGeneratingOTP(true);
    setPreferredMethod(method);
    const res = await api.generateOrderOTP(orderId);
    setGeneratingOTP(false);
    if (res.success) {
      fetchOrder();
    } else {
      showToast('Failed to generate OTP: ' + res.error, 'error');
    }
  };

  const handleUpdateStatus = async (newStatus, extras = {}) => {
    if (newStatus === 'rejected') {
      askConfirm(
        t('confirm_reject') || 'Are you sure you want to reject this order? This cannot be undone.',
        async () => {
          const res = await api.updateOrder(orderId, { status: newStatus, ...extras });
          if (res.success) {
            fetchOrder();
            setShowOtpModal(false);
            setShowCounterModal(false);
          } else {
            showToast('Update failed: ' + res.error, 'error');
          }
        }
      );
      return;
    }
    const res = await api.updateOrder(orderId, { status: newStatus, ...extras });
    if (res.success) {
      fetchOrder();
      setShowOtpModal(false);
      setShowCounterModal(false);
    } else {
      showToast('Update failed: ' + res.error, 'error');
    }
  };

  const handleAcceptCounter = async () => {
    const res = await api.updateOrder(orderId, {
      status: 'accepted',
      quantity_kg: order.proposed_quantity_kg,
      price_per_kg: order.proposed_price_per_kg
    });
    if (res.success) fetchOrder();
  };

  const handleSubmitCounter = async () => {
    if (!counterQty || Number(counterQty) <= 0 || !counterPrice || Number(counterPrice) <= 0) {
      setCounterErrors({ submit: t('err_valid_values') || 'Please enter valid quantity and price.' });
      return;
    }
    setSubmittingCounter(true);
    const res = await api.updateOrder(orderId, {
      status: 'counter_offered',
      proposed_quantity_kg: Number(counterQty),
      proposed_price_per_kg: Number(counterPrice)
    });
    setSubmittingCounter(false);
    if (res.success) {
      setShowCounterModal(false);
      fetchOrder();
    } else {
      setCounterErrors({ submit: res.error });
    }
  };

  const verifyDelivery = async (code) => {
    const finalOtp = code || otpInput;
    if (finalOtp.length !== 4) {
      setOtpError('Please enter the 4-digit code.');
      return;
    }
    setVerifying(true);
    setOtpError('');
    const res = await api.updateOrder(orderId, { 
      status: 'delivered', 
      otp: finalOtp 
    });
    setVerifying(false);
    if (res.success) {
      setShowOtpModal(false);
      setOtpInput('');
      setVerificationMode('otp');
      fetchOrder();
    } else {
      setOtpError(res.error || 'Invalid verification code.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-primary animate-pulse uppercase tracking-widest text-xs">{t('loading_order_details') || 'Fetching Order Secrets...'}</p>
    </div>
  );

  if (error || !order) return (
    <div className="container mx-auto py-20 px-4 text-center">
      <div className="bg-red-50 p-8 rounded-[40px] border-2 border-red-100 max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-red-900 uppercase tracking-tight">{t('error_header') || 'Something Went Wrong'}</h2>
        <p className="text-red-700/60 font-medium mt-2 mb-8">{error || 'Order not found'}</p>
        <Link to="/orders" className="btn btn-primary rounded-full px-8">{t('back_to_orders') || 'Back to Orders'}</Link>
      </div>
    </div>
  );

  const steps = [
    { id: 'pending',   label: t('status_pending') || 'Placed',       desc: t('desc_placed') || 'Order reached farmer' },
    { id: 'accepted',  label: t('status_accepted') || 'Confirmed',    desc: t('desc_confirmed') || 'Farmer accepted' },
    { id: 'paid',      label: t('status_paid') || 'Payment',     desc: t('desc_paid') || 'Funds secured' },
    { id: 'transit',   label: t('status_transit') || 'In Transit',    desc: t('desc_transit') || 'On the way' },
    { id: 'delivered', label: t('status_delivered') || 'Delivered',     desc: t('desc_delivered') || 'Safe & sound' }
  ];

  const currentIdx = steps.findIndex(s => s.id === order.status);
  const totalAmount = order.total_price || (order.quantity_kg * order.price_per_kg) || 0;

  return (
    <div className="container mx-auto py-8 px-4 pb-32">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-2">
          <Link to="/orders" className="inline-flex items-center gap-2 text-primary font-black hover:underline uppercase text-[10px] tracking-widest mb-2 opacity-60">
            <ArrowLeft className="w-3 h-3" /> {t('back_to_orders') || 'Back to Orders'}
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-heading font-black text-primary-dark uppercase tracking-tighter">
              {t(`data.${order.crop_name}`) !== `data.${order.crop_name}` ? t(`data.${order.crop_name}`) : order.crop_name}
            </h1>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border-2 ${getStatusColor(order.status)}`}>
              {t(`status_${order.status}`) || order.status}
            </span>
          </div>
          <p className="text-text-muted flex items-center gap-2 text-sm font-bold opacity-60">
            <Clock className="w-3.5 h-3.5" /> Order ID: #{(order.id || '').slice(-12).toUpperCase()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Farmer - Pending Actions */}
          {profile.role === 'farmer' && order.status === 'pending' && (
            <>
              <button 
                onClick={() => handleUpdateStatus('accepted')}
                className="btn btn-primary rounded-full px-8 py-4 font-black shadow-hard gap-2"
              >
                <CheckCircle className="w-5 h-5" /> {t('accept') || 'Accept Order'}
              </button>
              <button 
                onClick={() => { setCounterQty(order.quantity_kg); setCounterPrice(order.price_per_kg); setShowCounterModal(true); }}
                className="btn btn-outline border-primary text-primary rounded-full px-8 py-4 font-black shadow-soft gap-2 bg-white"
              >
                <TrendingUp className="w-5 h-5" /> {t('counter_offer') || 'Counter Offer'}
              </button>
              <button 
                onClick={() => handleUpdateStatus('rejected')}
                className="btn btn-outline border-red-200 text-red-500 hover:bg-red-50 rounded-full px-8 py-4 font-black shadow-soft"
              >
                <X className="w-5 h-5" /> {t('reject') || 'Reject'}
              </button>
            </>
          )}

          {/* Retailer - Counter Offered Actions */}
          {profile.role === 'retailer' && order.status === 'counter_offered' && (
            <>
              <button 
                onClick={handleAcceptCounter}
                className="btn btn-primary rounded-full px-8 py-4 font-black shadow-hard gap-2"
              >
                <CheckCircle className="w-5 h-5" /> {t('accept_counter') || 'Accept Counter'}
              </button>
              <button 
                onClick={() => handleUpdateStatus('rejected')}
                className="btn btn-outline border-red-200 text-red-500 hover:bg-red-50 rounded-full px-8 py-4 font-black shadow-soft"
              >
                <X className="w-5 h-5" /> {t('reject') || 'Reject'}
              </button>
            </>
          )}

          {/* Retailer - Accepted (Payment) Action */}
          {profile.role === 'retailer' && order.status === 'accepted' && (
            <Link to={`/payment/${order.id}`} className="btn btn-primary rounded-full px-8 py-4 font-black shadow-hard gap-3 flex items-center">
              <CreditCard className="w-5 h-5" /> {t('pay_now') || 'Pay Now'} →
            </Link>
          )}

          {/* Farmer - Transition Actions */}
          {profile.role === 'farmer' && order.status === 'paid' && (
            <button onClick={() => handleUpdateStatus('transit')} className="btn btn-accent rounded-full px-8 py-4 font-black shadow-hard gap-3 flex items-center">
              <Truck className="w-5 h-5" /> {t('mark_in_transit') || 'Start Delivery'}
            </button>
          )}
          {profile.role === 'farmer' && order.status === 'transit' && (
            <button onClick={() => setShowOtpModal(true)} className="btn btn-primary rounded-full px-8 py-4 font-black shadow-hard gap-3 flex items-center group">
              <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> {t('mark_delivered') || 'Verify Delivery'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details & Logistics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Unit Price', value: `₹${order.price_per_kg}/kg`, icon: TrendingUp },
              { label: 'Quantity', value: `${order.quantity_kg} kg`, icon: Package },
              { label: 'Total Value', value: `₹${totalAmount.toLocaleString()}`, icon: CreditCard, primary: true }
            ].map((stat, i) => (
              <div key={i} className={`card p-6 border-b-8 ${stat.primary ? 'bg-primary-dark text-white border-accent' : 'bg-white border-primary/20'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${stat.primary ? 'bg-white/10' : 'bg-primary/5 text-primary'}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${stat.primary ? 'opacity-40' : 'opacity-20'}`}>Metric</span>
                </div>
                <div className={`text-2xl font-black ${stat.primary ? 'text-accent' : 'text-primary-dark'}`}>{stat.value}</div>
                <div className={`text-[10px] font-black uppercase tracking-wider mt-1 ${stat.primary ? 'opacity-60' : 'opacity-30'}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Negotiation / Counter Details (Condition) */}
          {order.status === 'counter_offered' && (
            <div className="card p-8 bg-indigo-50 border-2 border-indigo-200 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Counter Offer Received</h3>
                  <p className="text-xs text-indigo-700/60 font-bold tracking-wide">The farmer has proposed a new deal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Proposed Price</span>
                  <div className="text-2xl font-black text-indigo-900">₹{order.proposed_price_per_kg}/kg</div>
                </div>
                <div className="bg-white/60 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Proposed Quantity</span>
                  <div className="text-2xl font-black text-indigo-900">{order.proposed_quantity_kg} kg</div>
                </div>
              </div>

              {profile.role === 'retailer' && (
                <div className="p-4 bg-white/40 rounded-xl border border-dashed border-indigo-300">
                  <p className="text-xs text-indigo-800 font-bold leading-relaxed italic">
                    "Please review the proposed quantities and pricing above. Accepting this will update the order totals and allow you to proceed with payment."
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main Info Card */}
          <div className="card p-8 bg-white space-y-8">
            <div className="flex items-center gap-3 border-b border-primary/5 pb-6">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary-dark uppercase tracking-tight">Trade Information</h3>
                <p className="text-xs text-text-muted font-bold tracking-wide">Key details about this transaction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{profile.role === 'farmer' ? 'Buyer Details' : 'Seller Details'}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-black text-primary-dark leading-none text-lg">
                        {profile.role === 'farmer'
                          ? (order.retailer?.full_name || order.retailer_name || order.retailer_id)
                          : (order.farmer?.full_name || order.farmer_name || order.farmer_id)}
                      </div>
                      <div className="text-[10px] font-bold text-text-muted uppercase mt-1">Verified Member</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Transaction Date</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-black text-primary-dark leading-none text-lg">
                      {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Logistics Overview</span>
                  <div className="space-y-4 mt-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5">Pickup Location</div>
                        <div className="text-sm font-bold text-primary-dark">{order.pickup_location || 'Not Specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-primary/5 pt-3">
                      <Truck className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5">Delivery Address</div>
                        <div className="text-sm font-bold text-primary-dark">{order.delivery_address || 'Not Specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Progress (Mini Timeline) Card */}
          <div className="card p-8 bg-white border-l-8 border-primary rounded-[40px] shadow-soft">
            <h3 className="text-xl font-black text-primary-dark uppercase tracking-tight mb-8">Journey Progress</h3>
            <div className="relative">
              <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-primary/10"></div>
              <div className="space-y-10">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentIdx;
                  const isActive = idx === currentIdx;
                  return (
                    <div key={step.id} className={`relative flex items-start gap-6 transition-all duration-700 ${isDone ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-2 grayscale'}`}>
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs z-10 transition-all duration-500 ${isDone ? 'bg-primary text-white shadow-hard scale-110' : 'bg-slate-100 text-slate-400 border border-slate-200'} ${isActive ? 'ring-4 ring-primary/20' : ''}`}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <div className="flex justify-between items-center group">
                          <h4 className={`font-black uppercase tracking-wide text-sm ${isDone ? 'text-primary-dark' : 'text-slate-400'}`}>{step.label}</h4>
                          {isActive && <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping"></span>}
                        </div>
                        <p className={`text-[10px] font-bold leading-tight mt-1 ${isDone ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                        {isDone && <div className="text-[8px] font-black uppercase text-primary tracking-widest mt-2 flex items-center gap-1 opacity-60"><CheckCircle className="w-2 h-2" /> Verified</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Handshake & Tracking */}
        <div className="space-y-8">
          
          {/* Handshake Card (Conditional) */}
          {['paid', 'transit'].includes(order.status) && (
            <div className="card border-none bg-primary-dark text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-accent text-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-black uppercase text-xs tracking-[0.2em]">Secure Handshake</h3>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest italic leading-none">Trust Trade Protocol Active</span>
                   </div>
                </div>
             </div>

             {profile.role === 'retailer' ? (
                !order.delivery_otp ? (
                  <div className="space-y-4 text-center">
                    <p className="text-[11px] font-bold text-white/60 mb-6 leading-relaxed">Verification code must be generated by the retailer to finalize the escrow release.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleGenerateOTP('otp')}
                        disabled={generatingOTP}
                        className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all group ${generatingOTP && preferredMethod === 'otp' ? 'bg-accent text-primary-dark border-accent' : 'bg-white/5 border-white/10 hover:border-accent hover:bg-white/10'}`}
                      >
                        <Smartphone className={`w-8 h-8 ${generatingOTP && preferredMethod === 'otp' ? 'animate-bounce' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Numeric</span>
                      </button>
                      <button 
                        onClick={() => handleGenerateOTP('qr')}
                        disabled={generatingOTP}
                        className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all group ${generatingOTP && preferredMethod === 'qr' ? 'bg-accent text-primary-dark border-accent' : 'bg-white/5 border-white/10 hover:border-accent hover:bg-white/10'}`}
                      >
                        <QrCode className={`w-8 h-8 ${generatingOTP && preferredMethod === 'qr' ? 'animate-bounce' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Secure QR</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group min-h-[320px] flex flex-col items-center justify-center bg-white/5 rounded-[40px] border border-white/10 p-4">
                    <div className="absolute top-6 right-6 flex gap-3 z-10">
                      <button 
                        onClick={() => setPreferredMethod('otp')}
                        className={`p-2 rounded-xl transition-all duration-300 ${preferredMethod === 'otp' ? 'bg-accent text-primary-dark shadow-hard scale-110' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPreferredMethod('qr')}
                        className={`p-2 rounded-xl transition-all duration-300 ${preferredMethod === 'qr' ? 'bg-accent text-primary-dark shadow-hard scale-110' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-full pt-12 pb-8 flex items-center justify-center">
                      {preferredMethod === 'otp' ? (
                        <div className="text-center animate-in zoom-in-95 duration-500">
                           <span className="text-[10px] font-black uppercase text-accent tracking-[0.4em] block mb-6 opacity-60">Handshake PIN</span>
                           <div className="text-8xl font-black text-accent tracking-[0.1em] leading-none">{order.delivery_otp}</div>
                           <p className="text-[9px] font-bold opacity-30 mt-10 uppercase tracking-[0.2em] max-w-[140px] mx-auto leading-relaxed">Provide this PIN to your delivery agent</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                          <span className="text-[10px] font-black uppercase text-accent tracking-[0.4em] block mb-6 opacity-60">Dynamic QR</span>
                          <div className="bg-white p-5 rounded-[48px] shadow-2xl ring-[12px] ring-white/5 group relative">
                             <QRCodeCanvas 
                               value={String(order.delivery_otp || '0000')} 
                               size={200} 
                               level="H" 
                               className="transition-transform group-hover:scale-105 duration-700"
                             />
                          </div>
                          <p className="text-[9px] font-bold opacity-30 mt-10 uppercase tracking-[0.2em] text-center leading-relaxed">Hold code steady for farmer to scan</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
             ) : (
                <div className="bg-white/5 rounded-[40px] border border-white/10 p-10 text-center flex flex-col items-center gap-6">
                   <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center text-accent animate-pulse">
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                   <div>
                      <h4 className="font-black text-sm uppercase tracking-widest mb-2">Escrow Protection</h4>
                      <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wider">Payments are held securely. Verification occurs at delivery point via Retailer Handshake.</p>
                   </div>
                </div>
             )}
            </div>
          )}
        </div>
      </div>

      {/* OTP/Scan Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-primary-dark/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
           {/* Reuse the Modal helper from Orders or just implement similar here for consistency */}
           <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => { setShowOtpModal(false); setVerificationMode('otp'); setOtpInput(''); setOtpError(''); }} className="p-2 hover:bg-primary/5 rounded-full transition-colors text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  <ShieldCheck className="w-3 h-3" /> Encrypted Handshake
                </div>
                <h2 className="text-3xl font-black text-primary-dark uppercase tracking-tight">Complete Delivery</h2>
                <p className="text-xs font-bold text-text-muted mt-2 px-4 leading-relaxed">Validate the order by scanning the buyer's QR or entering their 4-digit code.</p>
              </div>

              {/* Toggle */}
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 mb-8 border-dashed">
                {[
                  { id: 'otp', label: 'Manual Entry', icon: Smartphone },
                  { id: 'scan', label: 'QR Scanner', icon: QrCode }
                ].map(mode => (
                  <button 
                    key={mode.id}
                    onClick={() => {
                      setVerificationMode(mode.id);
                      if (mode.id === 'otp') {
                        setOtpInput('');
                        setOtpError('');
                        // Re-focus the hidden OTP input after the DOM updates
                        setTimeout(() => otpInputRef.current?.focus(), 100);
                      }
                    }}
                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${verificationMode === mode.id ? 'bg-primary text-white shadow-hard scale-105' : 'text-slate-400 hover:text-primary hover:bg-white'}`}
                  >
                    <mode.icon className="w-3.5 h-3.5" /> {mode.label}
                  </button>
                ))}
              </div>

              {/* OTP Entry — always in DOM, hidden via CSS when in scan mode.
                  Never unmount this so React doesn't conflict with scanner's DOM mutations. */}
              <div style={{ display: verificationMode === 'otp' ? 'block' : 'none' }} className="space-y-8">
                 <div className="relative flex justify-center gap-3">
                    {[0,1,2,3].map(i => (
                       <div key={i} className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all ${otpInput[i] ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-slate-50 text-transparent shadow-inner'} ${otpInput.length === i ? 'ring-4 ring-primary/20 border-primary' : ''}`}>
                          {otpInput[i] || '•'}
                       </div>
                    ))}
                    <input 
                      ref={otpInputRef}
                      type="tel"
                      pattern="[0-9]*"
                      maxLength="4"
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      onKeyDown={e => e.key === 'Enter' && verifyDelivery()}
                    />
                 </div>
              </div>

              {/* QR Scanner container — always in DOM so #detail-reader is never
                  unmounted while Html5QrcodeScanner still holds a reference to it.
                  ScannerOverlay IS conditionally rendered so it properly init/cleanups. */}
              <div style={{ display: verificationMode === 'scan' ? 'block' : 'none' }} className="relative">
                <div id="detail-reader" className="overflow-hidden rounded-[30px] border-2 border-slate-200 bg-slate-900 min-h-[250px] shadow-inner relative">
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-accent/40 animate-[ping_2s_infinite] shadow-[0_0_20px_rgba(255,255,255,0.5)] z-10"></div>
                </div>
                {verificationMode === 'scan' && <ScannerOverlay onScan={verifyDelivery} />}
              </div>

              {otpError && (
                 <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase text-center animate-shake">
                    <AlertCircle className="w-4 h-4 inline-block mr-2 -mt-0.5" /> {otpError}
                 </div>
              )}

              <div className="mt-8 space-y-4">
                 <button 
                  onClick={() => verifyDelivery()}
                  disabled={verifying || (verificationMode === 'otp' && otpInput.length < 4) || (verificationMode === 'scan' && verifying)}
                  className="w-full btn btn-primary py-5 rounded-2xl font-black uppercase shadow-hard gap-3 text-lg"
                 >
                   {verifying ? 'Validating...' : 'Release Funds Now'} <ShieldCheck className="w-5 h-5" />
                 </button>
                 <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.2em] leading-relaxed">
                    Once verified, ₹{(totalAmount * 0.98).toLocaleString()} will be instantly released to your linked bank account.
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-primary-dark/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setShowCounterModal(false)} className="p-2 hover:bg-primary/5 rounded-full transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <TrendingUp className="w-3 h-3" /> Negotiate Terms
              </div>
              <h2 className="text-3xl font-black text-primary-dark uppercase tracking-tight">Counter Offer</h2>
              <p className="text-xs font-bold text-text-muted mt-2 px-4 leading-relaxed">Adjust your available stock or pricing to reach a fair deal with the retailer.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Proposed Quantity (kg)</label>
                <input 
                  type="number"
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 font-black text-xl outline-none focus:border-primary transition-all"
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                  placeholder={order.quantity_kg}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Proposed Price (₹/kg)</label>
                <input 
                  type="number"
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 font-black text-xl outline-none focus:border-primary transition-all"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder={order.price_per_kg}
                />
              </div>

              {counterErrors.submit && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase text-center">
                  <AlertCircle className="w-4 h-4 inline-block mr-2 -mt-0.5" /> {counterErrors.submit}
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowCounterModal(false)}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitCounter}
                  disabled={submittingCounter}
                  className="flex-[2] btn btn-primary py-4 rounded-2xl font-black uppercase shadow-hard text-sm"
                >
                  {submittingCounter ? 'Submitting...' : 'Send Counter Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-primary-dark/80 backdrop-blur-xl flex items-center justify-center p-4 z-[200] animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-primary-dark uppercase tracking-tight mb-2">Confirm Action</h3>
            <p className="text-sm font-bold text-text-muted leading-relaxed mb-8">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-[2] btn bg-red-500 text-white hover:bg-red-600 py-4 rounded-2xl font-black uppercase shadow-hard text-sm transition-colors border-none"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Scanner Logic Container
const ScannerOverlay = ({ onScan }) => {
  const scannerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const scanner = new Html5QrcodeScanner("detail-reader", { 
        fps: 20, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      });
      scannerRef.current = scanner;
      
      scanner.render((decodedText) => {
        if (decodedText && decodedText.length === 4) {
          onScan(decodedText);
          scanner.clear().catch(e => console.warn(e));
        }
      }, () => {});
    }, 150);

    // Proper cleanup: cancel pending timer AND clear the scanner on unmount
    return () => {
      clearTimeout(timerRef.current);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.warn('Scanner cleanup:', e));
        scannerRef.current = null;
      }
    };
  }, []);
  return null;
};

// Status styling helper
const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'counter_offered': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'transit': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'delivered': return 'bg-primary/10 text-primary-dark border-primary/20';
    case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

export default OrderDetail;
