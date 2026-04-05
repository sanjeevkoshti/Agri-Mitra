import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout';
import RaithaMithra from './components/RaithaMithra';
import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import FarmerDashboard from './pages/FarmerDashboard';
import AddCrop from './pages/AddCrop';
import Marketplace from './pages/Marketplace';
import SpoilageRescue from './pages/SpoilageRescue';
import Orders from './pages/Orders';
import AiPredictor from './pages/AiPredictor';
import { Payment, Tracking } from './pages/Fulfillment';

const App = () => {
  const profile = JSON.parse(localStorage.getItem('mc_profile') || 'null');
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-primary selection:text-white">
      <Navbar />
      <main className={`flex-grow ${!isHomePage ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Farmer Routes */}
          <Route path="/farmer-dash" element={<FarmerDashboard />} />
          <Route path="/add-crop" element={<AddCrop />} />
          <Route path="/ai-predictor" element={<AiPredictor />} />
          
          {/* Retailer Routes */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/spoilage-rescue" element={<SpoilageRescue />} />
          
          {/* Shared Routes */}
          <Route path="/orders" element={<Orders />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/track/:orderId" element={<Tracking />} />
          
          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <RaithaMithra />
      <Footer />
    </div>
  );
};

export default App;
