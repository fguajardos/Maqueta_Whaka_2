import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import WhatsAppApp from './app1-whatsapp/WhatsAppApp';
import AdminApp from './app2-admin/AdminApp';
import TrackingPage from './TrackingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/whatsapp" element={<WhatsAppApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
