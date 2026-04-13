import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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
  const isFullscreenPage = ['/', '/login', '/reset-password'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-primary selection:text-white">
      <Navbar />
      <main className={`flex-grow ${!isFullscreenPage ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Farmer Routes */}
          <Route path="/farmer-dash" element={
            <ProtectedRoute allowedRole="farmer"><FarmerDashboard /></ProtectedRoute>
          } />
          <Route path="/add-crop" element={
            <ProtectedRoute allowedRole="farmer"><AddCrop /></ProtectedRoute>
          } />
          
          {/* Retailer Routes */}
          <Route path="/marketplace" element={
            <ProtectedRoute allowedRole="retailer"><Marketplace /></ProtectedRoute>
          } />
          
          {/* Shared Authenticated Routes */}
          <Route path="/spoilage-rescue" element={
            <ProtectedRoute><SpoilageRescue /></ProtectedRoute>
          } />
          <Route path="/ai-predictor" element={
            <ProtectedRoute><AiPredictor /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
          <Route path="/payment/:orderId" element={
            <ProtectedRoute><Payment /></ProtectedRoute>
          } />
          <Route path="/track/:orderId" element={
            <ProtectedRoute><Tracking /></ProtectedRoute>
          } />
          
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
