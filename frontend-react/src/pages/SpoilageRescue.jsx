import React from 'react';
import { AlertTriangle, Phone, MapPin, Clock, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const SpoilageRescue = () => {
  const { t } = useI18n();

  const urgentListings = [
    { id: 1, crop: "Tomato", qty: "500kg", location: "Kolar, KA", time: "24h left", discount: "40% OFF" },
    { id: 2, crop: "Onion", qty: "1200kg", location: "Nashik, MH", time: "48h left", discount: "25% OFF" },
    { id: 3, crop: "Cabbage", qty: "300kg", location: "Pune, MH", time: "12h left", discount: "50% OFF" }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-danger/5 border-2 border-danger/20 rounded-large p-8 mb-12 relative overflow-hidden">
        <AlertTriangle className="w-32 h-32 absolute -right-4 -bottom-4 text-danger opacity-10 rotate-12" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <AlertTriangle className="w-3 h-3" /> Urgent Response Required
          </div>
          <h1 className="text-4xl font-heading font-black text-primary-dark uppercase tracking-tight mb-4">Spoilage Rescue Network</h1>
          <p className="text-text-muted text-lg mb-8">Bypassing standard supply chains to rescue fresh produce. If your crop is at risk of spoilage, we connect you to immediate processing units and bulk buyers at discounted rates.</p>
          <div className="flex flex-wrap gap-4">
            <button className="btn btn-primary bg-danger hover:bg-danger/90 border-none px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-hard">Report At-Risk Crop</button>
            <button className="btn btn-outline border-danger text-danger hover:bg-danger hover:text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest">Become a Rescue Buyer</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-heading font-black text-primary-dark uppercase tracking-wide mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-danger" /> Urgent Rescue Listings
          </h2>
          <div className="space-y-4">
            {urgentListings.map(item => (
              <div key={item.id} className="card border-l-4 border-l-danger hover:shadow-hard transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.crop === 'Tomato' ? '🍅' : item.crop === 'Onion' ? '🧅' : '🥬'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary-dark">{item.crop}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                         <span className="flex items-center gap-1"><Package className="w-3 h-3"/> {item.qty}</span>
                         <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {item.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-danger font-black text-xl">{item.discount}</div>
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-tighter flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {item.time}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm px-6 rounded-full font-black uppercase text-[10px] tracking-widest">Rescue Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="card bg-primary-dark text-white p-6 shadow-hard">
            <h3 className="font-heading font-black text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> Rescue Directives
            </h3>
            <ul className="space-y-4 text-sm font-medium opacity-80">
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-accent flex-shrink-0" /> List item only if it has less than 72 hours of shelf life.</li>
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-accent flex-shrink-0" /> Minimum 20% discount mandatory for rescue listings.</li>
              <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-accent flex-shrink-0" /> Verified logistics will prioritize these pickups.</li>
            </ul>
          </div>

          <div className="card border-2 border-primary/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-full"><Heart className="w-6 h-6 text-success" /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-primary-dark">Social Impact</h3>
            </div>
            <p className="text-xs font-bold text-text-muted leading-relaxed">The Spoilage Rescue Network has prevented over 450 tons of food waste this year, saving farmers from total financial loss.</p>
            <div className="mt-6 pt-6 border-t border-primary/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Rescue Hotline</span>
              <span className="font-black text-primary flex items-center gap-1"><Phone className="w-3 h-3" /> 1800-RESCUE-MC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpoilageRescue;
