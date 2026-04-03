import React from 'react';
import { Sprout, ShoppingBag, Smartphone, Truck, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="hero bg-gradient-to-br from-primary-dark via-[#1a5c3a] to-primary text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4 uppercase tracking-tight">
            Sell Crops. <span className="text-accent">No Middlemen.</span>
          </h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8 font-sans">
            Mandi-Connect bridges farmers directly to retailers across India. Get fair prices and track orders.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login?role=farmer" className="btn btn-accent btn-lg text-lg">
              <Sprout className="w-5 h-5" /> 🌱 I'm a Farmer
            </Link>
            <Link to="/login?role=retailer" className="btn btn-outline btn-lg text-lg border-white/60 text-white hover:bg-white hover:text-primary">
              <ShoppingBag className="w-5 h-5" /> 🛒 I'm a Retailer
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-8 px-4 border-b border-primary/10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 max-w-2xl mx-auto gap-8">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-primary">0%</div>
              <div className="text-sm text-text-muted">Commission Charged</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-primary">UPI</div>
              <div className="text-sm text-text-muted">Instant Payments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-bg">
        <div className="container mx-auto">
          <h2 className="text-center text-3xl font-heading mb-2">Everything you need to trade directly</h2>
          <p className="text-center text-text-muted mb-12">Designed for rural India — simple and direct.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Sprout className="w-10 h-10 text-primary" />}
              title="List Your Crops"
              desc="Farmers add crop listings with price, quantity, and harvest date."
            />
            <FeatureCard 
              icon={<ShoppingBag className="w-10 h-10 text-primary" />}
              title="Browse & Order"
              desc="Retailers browse listings, filter by crop type, and place bulk orders directly."
            />
            <FeatureCard 
              icon={<Smartphone className="w-10 h-10 text-primary" />}
              title="UPI Payments"
              desc="Pay instantly using any UPI app via QR code or payment link."
            />
            <FeatureCard 
              icon={<Truck className="w-10 h-10 text-primary" />}
              title="Track Orders"
              desc="Follow every order from placement to delivery with real-time status updates."
            />
            <FeatureCard 
              icon={<Bot className="w-10 h-10 text-primary" />}
              title="AI Price Predictor"
              desc="Predict market trends and get recommendations on when to sell your crops."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-dark text-white py-16 px-4 text-center">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-heading mb-4">Ready to trade without middlemen?</h2>
          <p className="opacity-85 mb-8 max-w-lg mx-auto">Join thousands of farmers and retailers already using Mandi-Connect.</p>
          <Link to="/login" className="btn btn-accent btn-lg text-lg">
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="card text-center group">
    <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-text-muted text-sm">{desc}</p>
  </div>
);

export default Home;
