import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Smartphone, CheckCircle, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      const res = await api.getOrder(orderId);
      if (res.success) setOrder(res.data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const upiId = "agri.mitra@upi"; // Updated UPI ID
  const totalAmount = order ? (order.total_price || (order.quantity_kg * order.price_per_kg) || 0) : 0;
  const upiLink = order ? `upi://pay?pa=${upiId}&pn=AgriMitra&am=${totalAmount}&tn=Order_${orderId.slice(-6)}&cu=INR` : '';

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setPaying(true);
    
    // 1. Load Razorpay Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      setPaying(false);
      return;
    }

    // 2. Create Order on Backend
    const orderRes = await api.createRazorpayOrder(orderId);
    if (!orderRes.success) {
      alert(orderRes.error || "Failed to initiate payment");
      setPaying(false);
      return;
    }

    const { id: rzpOrderId, amount, currency } = orderRes.data;

    // 3. Open Razorpay Checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Loaded from Vercel Environment Variables
      amount: amount,
      currency: currency,
      name: "Agri-Mitra",
      description: `Payment for ${order.crop_name}`,
      order_id: rzpOrderId,
      handler: async (response) => {
        // 4. Verify Payment on Backend
        const verifyRes = await api.confirmPayment(orderId, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (verifyRes.success) {
          alert("Payment Successful!");
          navigate('/orders');
        } else {
          alert(verifyRes.error || "Payment verification failed");
        }
        setPaying(false);
      },
      prefill: {
        name: " ",
        email: " ",
        contact: " "
      },
      theme: {
        color: "#0f3d2e", // Matches Agri-Mitra green
        hide_topbar: true
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: "UPI / QR Code",
              instruments: [{ method: "upi" }],
            },
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: true },
        },
      },
      modal: {
        ondismiss: () => setPaying(false),
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return <div className="p-20 text-center font-black">{t('loading_payment') || 'Loading Payment Details...'}</div>;
  if (!order) return <div className="p-20 text-center text-danger font-black">{t('order_not_found') || 'Order not found'}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <Link to="/orders" className="inline-flex items-center gap-2 text-primary font-black mb-8 hover:underline uppercase text-xs tracking-widest">
        <ArrowLeft className="w-4 h-4" /> {t('back_to_orders') || 'Back to Orders'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="card space-y-8">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('checkout') || 'Checkout'}</h1>
            <p className="text-text-muted">{t('checkout_desc') || 'Secure UPI payment for your order.'}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary opacity-60">{t('order_summary') || 'Order Summary'}</h3>
            <div className="bg-bg rounded-large p-6 border border-primary/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary-dark">{order.crop_name}</span>
                <span className="font-black text-xs">₹{order.price_per_kg} × {order.quantity_kg} kg</span>
              </div>
              <div className="pt-4 border-t border-primary/10 flex justify-between items-center text-2xl font-black text-primary">
                <span>{t('total_amount') || 'Total Amount'}</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary opacity-60">{t('payment_status') || 'Payment Process'}</h3>
            <div className="p-6 border-2 border-primary/10 bg-white rounded-large flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-primary/10 text-primary rounded-full"><ShieldCheck className="w-8 h-8" /></div>
              <div>
                <div className="font-black text-primary-dark uppercase tracking-wide text-lg">{t('secure_checkout') || 'Secure Checkout'}</div>
                <div className="text-xs text-text-muted font-bold max-w-xs mx-auto mt-2">
                  {t('razorpay_desc') || 'Click below to pay securely via Razorpay. Supported: UPI, Cards, Netbanking.'}
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePayment} 
            disabled={paying}
            className="w-full btn btn-primary py-5 text-xl font-black rounded-large shadow-hard gap-3 group"
          >
            {paying ? (t('verifying_payment') || 'Verifying with Bank...') : (t('pay_now_securely') || 'Pay Now Securely')} <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          
          <p className="flex items-center justify-center gap-2 text-xs text-text-muted font-bold opacity-60 uppercase tracking-widest mt-4">
            <ShieldCheck className="w-4 h-4 text-primary" /> {t('encrypted_security') || '256-bit Encrypted Security'}
          </p>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8 bg-primary/5 rounded-[40px] p-12 border border-primary/10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-hard text-primary">
            <Smartphone className="w-12 h-12" />
          </div>
          <div className="max-w-xs space-y-4">
            <h4 className="font-black uppercase tracking-tight text-primary-dark text-2xl">{t('mobile_ready') || 'Seamless Experience'}</h4>
            <p className="text-sm text-text-muted font-medium leading-relaxed">
              {t('razorpay_experience') || 'Our payment gateway provides the fastest checkout experience across all your favorite apps like GPay and PhonePe.'}
            </p>
          </div>
          <div className="flex gap-4 grayscale opacity-30 mt-8">
             <div className="font-black italic text-2xl uppercase tracking-tighter">Razorpay</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      const res = await api.getOrder(orderId);
      if (res.success) setOrder(res.data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="p-20 text-center font-black">{t('locating_shipment') || 'Locating Shipment...'}</div>;
  if (!order) return <div className="p-20 text-center text-danger font-black">{t('order_not_found') || 'Order not found'}</div>;

  const steps = [
    { id: 'pending',   label: t('step_placed') || 'Order Placed',       time: order.created_at, desc: t('desc_placed') || 'Your request reached the farmer.' },
    { id: 'accepted',  label: t('step_confirmed') || 'Farmer Confirmed',    time: null, desc: t('desc_confirmed') || 'Farmer accepted the order.' },
    { id: 'paid',      label: t('step_paid') || 'Payment Verified',    time: null, desc: t('desc_paid') || 'Funds secured via UPI.' },
    { id: 'transit',   label: t('step_transit') || 'Out for Delivery',    time: null, desc: t('desc_transit') || 'Shipment has left the farm.' },
    { id: 'delivered', label: t('step_delivered') || 'Delivered',            time: null, desc: t('desc_delivered') || 'Crop delivered successfully.' }
  ];

  const currentIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="container mx-auto py-8 px-4">
      <Link to="/orders" className="inline-flex items-center gap-2 text-primary font-black mb-8 hover:underline uppercase text-xs tracking-widest">
        <ArrowLeft className="w-4 h-4" /> {t('back_to_dashboard') || 'Back to Dashboard'}
      </Link>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('order_tracking') || 'Order Tracking'}</h1>
            <p className="text-text-muted">{t('track_journey_desc') ? t('track_journey_desc').replace('{crop}', order.crop_name) : `Track the journey of your ${order.crop_name} harvest.`}</p>
          </div>
          <div className="px-4 py-2 bg-primary text-white rounded-full text-xs font-black uppercase tracking-[0.2em]">#{(order.id || '').slice(-8)}</div>
        </div>

        <div className="card space-y-12 py-12 px-8">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-4 bottom-4 w-1 bg-bg border-x border-primary/10"></div>
            
            <div className="space-y-12">
              {steps.map((step, idx) => {
                const isDone = idx <= currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div key={step.id} className={`relative flex items-start gap-8 ${isDone ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs z-10 transition-all duration-500 scale-110 ${isDone ? 'bg-primary text-white shadow-hard' : 'bg-bg text-text-muted border-2 border-primary/10'} ${isActive ? 'ring-4 ring-primary/20' : ''}`}>
                      {isDone ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-primary-dark uppercase tracking-wide leading-none">{step.label}</h4>
                      <p className="text-xs text-text-muted font-bold leading-relaxed">{step.desc}</p>
                      {isDone && <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 block italic">{t('completed') || 'Completed'}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card bg-bg border-dashed border-2 border-primary/20 p-6 space-y-4">
          <h5 className="font-black text-primary-dark uppercase text-xs tracking-widest mb-1 flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> {t('logistics_info') || 'Logistics Info'}</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-text-muted font-bold">{t('pickup_location') || 'Pickup Location'}</span>
              <span className="font-black text-right">{order.pickup_location || t('tbd') || 'TBD'}</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-text-muted font-bold">{t('delivery_address') || 'Delivery Address'}</span>
              <span className="font-black text-right">{order.delivery_address || t('tbd') || 'TBD'}</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-text-muted font-bold">{t('est_delivery') || 'Est. Delivery'}</span>
              <span className="font-black text-right">{order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : (t('tbd') || 'TBD')}</span>
            </div>
            {order.upi_transaction_id && (
               <div className="flex justify-between pb-2">
                <span className="text-text-muted font-bold">{t('upi_ref') || 'UPI Ref.'}</span>
                <span className="font-black text-right">{order.upi_transaction_id}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] font-bold text-text-muted leading-tight mt-4 pt-4 border-t border-primary/10">{t('logistics_desc') || 'Agri-Mitra uses local farm-logistics nodes. Estimated delivery depends on distance and farm accessibility.'}</p>
        </div>

        {/* Secure Delivery Handshake Card for Retailer */}
        {['paid', 'transit'].includes(order.status) && order.otp_code && (
           <div className="card bg-primary-dark text-white p-6 md:p-8 shadow-hard relative overflow-hidden">
              <ShieldCheck className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black uppercase text-accent mb-2">Secure Delivery Code</h3>
                    <p className="text-xs font-bold opacity-70 leading-relaxed uppercase tracking-wide">
                       Share this 4-digit code with the farmer ONLY after you have received and verified the quality of your harvest.
                    </p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center gap-2 min-w-[160px]">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Verification OTP</span>
                    <div className="text-4xl font-black text-accent tracking-[0.3em]">{order.otp_code}</div>
                    <Smartphone className="w-4 h-4 opacity-40 mt-1" />
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const ArrowRight = ({ className }) => <span className={className}>→</span>;

export { Payment, Tracking };
