import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Checkout } from './pages/Checkout';
import { Inventory } from './pages/Inventory';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Layout routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Fallback root redirects to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Common Sales terminal access */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="customers" element={<Customers />} />
            
            {/* Admin only restricted portals */}
            <Route 
              path="inventory" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings (both, but Settings internally filters tabs based on role) */}
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}