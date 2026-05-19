import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollProgressBar from './components/ui/ScrollProgressBar';
import CursorSpotlight from './components/ui/CursorSpotlight';

// Public Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmed from './pages/OrderConfirmed';
import OfferSelection from './pages/OfferSelection';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductEdit from './pages/admin/ProductEdit';
import Orders from './pages/admin/Orders';
import Settings from './pages/admin/Settings';
import AdminOffers from './pages/admin/Offers';
import Feedback from './pages/admin/Feedback';

import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Layouts
const Layout = () => (
  <div className="min-h-screen flex flex-col bg-ivory">
    <ScrollProgressBar />
    <CursorSpotlight />
    <Navbar />
    <main className="flex-grow flex flex-col pt-[72px]">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="offer/:offerId" element={<OfferSelection />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-confirmed/:id" element={<OrderConfirmed />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEdit />} />
            <Route path="products/edit/:id" element={<ProductEdit />} />
            <Route path="orders" element={<Orders />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
