import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Checkout } from './pages/Checkout';
import { Inventory } from './pages/Inventory';
import { Dashboard } from './pages/Dashboard';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/checkout" replace />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>);

}