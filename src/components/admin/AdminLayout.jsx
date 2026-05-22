import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CONFIG } from '../../config';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Tag, MessageSquare, Menu, X, Home } from 'lucide-react';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const esRef = useRef(null);

  // Fetch initial count of unread (status=new) orders
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return;
    fetch(`${BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => setNewOrderCount(j.data?.ordersByStatus?.new ?? 0))
      .catch(() => {});
  }, []);

  // Open a single SSE connection for the whole admin session
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return;

    const es = new EventSource(`${BASE}/admin/orders/events?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.addEventListener('new-order', (e) => {
      const order = JSON.parse(e.data);
      setNewOrderCount(prev => prev + 1);
      // Notify the Orders page (if mounted) without prop-drilling
      window.dispatchEvent(new CustomEvent('admin:new-order', { detail: order }));
    });

    return () => { es.close(); esRef.current = null; };
  }, []);

  // Clear badge when admin navigates to Orders
  useEffect(() => {
    // eslint-disable-next-line
    if (location.pathname === '/admin/orders') setNewOrderCount(0);
  }, [location.pathname]);

  const handleLogout = () => {
    esRef.current?.close();
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Offers', path: '/admin/offers', icon: Tag },
    { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare },
    { label: 'Homepage', path: '/admin/homepage', icon: Home },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50" dir="ltr">

      {/* ── Desktop Sidebar (md+) ─────────────────────────────── */}
      <aside className="hidden md:flex md:w-64 bg-jet text-white flex-col shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="font-serif text-2xl text-gold">
            {CONFIG.brandName}
          </Link>
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 mt-2">Admin Panel</p>
        </div>

        <nav className="flex-grow p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
                             (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const showBadge = item.path === '/admin/orders' && newOrderCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 font-sans text-sm rounded transition-colors ${
                  isActive ? 'bg-white/10 text-gold' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                    {newOrderCount > 99 ? '99+' : newOrderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-gray-300 hover:text-white transition-colors w-full text-left"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar (below md) ─────────────────────────── */}
      <div className="md:hidden bg-jet text-white shrink-0">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <Link to="/" className="font-serif text-xl text-gold">
            {CONFIG.brandName}
          </Link>
          <button
            onClick={() => setIsMobileNavOpen(o => !o)}
            aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
            className="p-3 text-gray-300 hover:text-white transition-colors"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Collapsible nav */}
        {isMobileNavOpen && (
          <nav className="flex flex-col gap-1 p-3 border-b border-white/10">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                               (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const showBadge = item.path === '/admin/orders' && newOrderCount > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-sans text-sm rounded transition-colors ${
                    isActive ? 'bg-white/10 text-gold' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                      {newOrderCount > 99 ? '99+' : newOrderCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-gray-300 hover:text-white transition-colors w-full text-left rounded"
              style={{ minHeight: 'unset', minWidth: 'unset' }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        )}

        {/* Horizontal icon tab bar — always visible on mobile for quick switching */}
        <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
                             (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const showBadge = item.path === '/admin/orders' && newOrderCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileNavOpen(false)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-3.5 rounded text-center shrink-0 transition-colors ${
                  isActive ? 'text-gold bg-white/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-sans text-[9px] uppercase tracking-wide">{item.label}</span>
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {newOrderCount > 9 ? '9+' : newOrderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-grow p-4 md:p-8 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
