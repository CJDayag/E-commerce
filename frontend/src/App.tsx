import "@radix-ui/themes/styles.css";
import '@/index.css';
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { TitleProvider, TitleContext } from './context/TitleContext';
import AuthLayout from './layouts/AuthLayout';
import GuestLayout from './layouts/GuestLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import ContactUs from './pages/Contact';
import AboutUs from './pages/AboutUs';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import Products from './pages/Products';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from '@/pages/admin/ProductManagement';
import OrderManagement from '@/pages/admin/Orders'
import CheckOut from '@/pages/Checkout'
import Orders from '@/pages/Orders';
import Analytics from '@/pages/admin/Analytics';
import { useAuth } from './context/AuthContext';
import { Toaster } from '@/components/ui/sonner'
import { useContext } from 'react';

export default function App() {
  const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
                <div className="relative w-12 h-12 mb-3">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">Loading...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait while we initialize the interface</p>
            </div>
        );
    }

  return (
      <BrowserRouter>
        <TitleProvider>
          <HelmetProvider>
            <PageTitle />
            <Toaster position={'top-right'} />
            <Routes>
              {/* Public Routes */}
              <Route element={<GuestLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<Products />} />
              </Route>

              {/* User Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<CheckOut />} />
                <Route path="/orders" element={<Orders />} />
              </Route>

              {/* Admin Routes */}
              {user && (user.is_staff || user.is_superuser) ? (
                  <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/analytics" element={<Analytics />} />
                    <Route path="/admin/productmanagement" element={<ProductManagement />} />
                    <Route path="/admin/orders" element={<OrderManagement />} />
                  </Route>
              ) : null}

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </HelmetProvider>
        </TitleProvider>
      </BrowserRouter>
  );
}

// Component to update the document title
function PageTitle() {
  const { title } = useContext(TitleContext);
  
  return (
    <Helmet>
      <title>{title ? `${title} | eStore` : 'eStore'}</title>
    </Helmet>
  );
}