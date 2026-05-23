import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
import { adminApi } from '../../lib/api';
import {
  Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle,
  Clock, CheckCircle2, XCircle, RefreshCw, ChevronLeft,
} from 'lucide-react';

const STATUS_META = {
  new:       { label: 'جديد',       en: 'New',       dot: 'bg-amber-400',  bar: 'bg-amber-400' },
  contacted: { label: 'تم التواصل', en: 'Contacted', dot: 'bg-blue-400',   bar: 'bg-blue-400' },
  confirmed: { label: 'مؤكد',       en: 'Confirmed', dot: 'bg-indigo-400', bar: 'bg-indigo-400' },
  fulfilled: { label: 'مُسلَّم',    en: 'Fulfilled', dot: 'bg-green-400',  bar: 'bg-green-400' },
  completed: { label: 'مُسلَّم',    en: 'Fulfilled', dot: 'bg-green-400',  bar: 'bg-green-400' },
  cancelled: { label: 'ملغي',       en: 'Cancelled', dot: 'bg-red-400',    bar: 'bg-red-400' },
};

// Statuses that contribute to "pending revenue" — money on the books but not collected.
const PENDING_STATUSES = new Set(['new', 'contacted', 'confirmed']);
// Counted as sold for AOV purposes.
const SOLD_STATUSES = new Set(['confirmed', 'fulfilled', 'completed']);

const StatCard = ({ title, value, subtitle, icon: Icon, accent = 'gold', to, loading }) => {
  const accentMap = {
    gold:   { ring: 'border-gold/20',   tint: 'bg-gold/5',   text: 'text-gold' },
    amber:  { ring: 'border-amber-200', tint: 'bg-amber-50', text: 'text-amber-600' },
    green:  { ring: 'border-green-200', tint: 'bg-green-50', text: 'text-green-600' },
    blue:   { ring: 'border-blue-200',  tint: 'bg-blue-50',  text: 'text-blue-600' },
    indigo: { ring: 'border-indigo-200',tint: 'bg-indigo-50',text: 'text-indigo-600' },
    rose:   { ring: 'border-rose-200',  tint: 'bg-rose-50',  text: 'text-rose-600' },
  };
  const a = accentMap[accent] || accentMap.gold;

  const inner = (
    <div className={`bg-white p-5 border ${a.ring} rounded shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-3`}>
      <div className="min-w-0">
        <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-gray-500 mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
        ) : (
          <h3 className="font-serif text-2xl md:text-3xl text-jet mb-1 leading-tight truncate">{value}</h3>
        )}
        {subtitle && <p className="font-sans text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      <div className={`p-2.5 ${a.tint} rounded shrink-0`}>
        <Icon className={`w-5 h-5 ${a.text}`} />
      </div>
    </div>
  );

  return to ? <Link to={to} className="block">{inner}</Link> : inner;
};

const Panel = ({ title, action, children }) => (
  <div className="bg-white border border-gray-200 rounded shadow-sm">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="font-serif text-lg text-jet">{title}</h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const [statsData, ordersData] = await Promise.all([
        adminApi.stats(),
        adminApi.orders.list({ limit: 5, page: 1 }).catch(() => ({ items: [] })),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Derived values
  const statusCounts = stats?.ordersByStatus || [];
  const statusByKey = Object.fromEntries(statusCounts.map(s => [s.status, s]));

  const newCount       = statusByKey.new?.cnt ?? 0;
  const fulfilledCount = (statusByKey.fulfilled?.cnt ?? 0) + (statusByKey.completed?.cnt ?? 0);
  const soldCount = statusCounts
    .filter(s => SOLD_STATUSES.has(s.status))
    .reduce((sum, s) => sum + (s.cnt || 0), 0);
  const aov = soldCount > 0 ? (stats?.totalRevenue ?? 0) / soldCount : 0;
  // statusCounts[].revenue is the raw SUM(total) from the orders table in piasters
  // (the /stats route only converts totalRevenue and topProducts revenue, not these).
  // 1 JOD = 1000 piasters per server/src/lib/pricing.js.
  const pendingRevenue = statusCounts
    .filter(s => PENDING_STATUSES.has(s.status))
    .reduce((sum, s) => sum + (s.revenue || 0), 0) / 1000;
  const fulfillmentRate = stats?.totalOrders > 0
    ? Math.round((fulfilledCount / stats.totalOrders) * 100)
    : 0;

  const totalStatusOrders = statusCounts.reduce((sum, s) => sum + (s.cnt || 0), 0) || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-jet mb-1">Dashboard Overview</h1>
          <p className="font-sans text-xs text-gray-500">
            {loading ? 'Loading…' : `Last updated ${new Date().toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gold hover:text-gold transition-colors font-sans text-xs font-semibold rounded"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          subtitle="Confirmed + fulfilled"
          icon={DollarSign}
          accent="gold"
          loading={loading}
        />
        <StatCard
          title="New Orders"
          value={newCount}
          subtitle={newCount > 0 ? 'Needs action' : 'All caught up'}
          icon={ShoppingCart}
          accent="amber"
          to="/admin/orders"
          loading={loading}
        />
        <StatCard
          title="Avg Order"
          value={formatCurrency(aov)}
          subtitle={`Across ${soldCount} sold`}
          icon={TrendingUp}
          accent="indigo"
          loading={loading}
        />
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(pendingRevenue)}
          subtitle="Not yet collected"
          icon={Clock}
          accent="blue"
          loading={loading}
        />
        <StatCard
          title="Fulfilled"
          value={fulfilledCount}
          subtitle={`${fulfillmentRate}% fulfillment rate`}
          icon={CheckCircle2}
          accent="green"
          loading={loading}
        />
        <StatCard
          title="Active Products"
          value={stats?.activeProducts ?? 0}
          subtitle={`${stats?.totalProducts ?? 0} total`}
          icon={Package}
          accent="rose"
          to="/admin/products"
          loading={loading}
        />
      </div>

      {/* ── Orders by Status (full-width bar) ────────────────────────── */}
      <div className="mb-8">
        <Panel
          title="Orders by Status"
          action={
            <Link to="/admin/orders" className="font-sans text-xs text-gold hover:text-jet flex items-center gap-1">
              View all <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
            </Link>
          }
        >
          {loading ? (
            <div className="h-3 bg-gray-100 animate-pulse rounded" />
          ) : statusCounts.length === 0 ? (
            <p className="font-sans text-sm text-gray-400 text-center py-4">No orders yet.</p>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="flex h-3 rounded overflow-hidden bg-gray-100 mb-4">
                {statusCounts.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.new;
                  const pct = (s.cnt / totalStatusOrders) * 100;
                  return (
                    <div
                      key={s.status}
                      className={`${meta.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${meta.en}: ${s.cnt}`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {statusCounts.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.new;
                  const pct = ((s.cnt / totalStatusOrders) * 100).toFixed(0);
                  return (
                    <div key={s.status} className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans text-xs font-semibold text-jet truncate">{meta.en}</div>
                        <div className="font-sans text-[11px] text-gray-500">{s.cnt} · {pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* ── Top products + Recent orders ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top selling products */}
        <Panel
          title="Top Selling Products"
          action={
            <Link to="/admin/products" className="font-sans text-xs text-gold hover:text-jet flex items-center gap-1">
              All products <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
            </Link>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : !stats?.topProducts?.length ? (
            <p className="font-sans text-sm text-gray-400 text-center py-4">No sales yet.</p>
          ) : (
            <ol className="space-y-2">
              {stats.topProducts.map((p, i) => {
                const max = stats.topProducts[0].units || 1;
                const pct = (p.units / max) * 100;
                return (
                  <li key={p.product_id || p.product_name} className="relative bg-gray-50 hover:bg-gold/[0.04] transition-colors p-3 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gold/8"
                      style={{ width: `${pct}%`, background: 'linear-gradient(to right, rgba(212,175,55,0.10), rgba(212,175,55,0.02))' }}
                      aria-hidden
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 shrink-0 bg-gold text-white text-xs font-bold rounded-full flex items-center justify-center font-sans">
                          {i + 1}
                        </span>
                        <span className="font-sans text-sm text-jet truncate font-medium">{p.product_name}</span>
                      </div>
                      <div className="shrink-0 text-end">
                        <div className="font-sans text-xs font-bold text-jet">{p.units} sold</div>
                        <div className="font-sans text-[10px] text-gray-500">{formatCurrency(p.revenue)}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        {/* Recent orders */}
        <Panel
          title="Recent Orders"
          action={
            <Link to="/admin/orders" className="font-sans text-xs text-gold hover:text-jet flex items-center gap-1">
              View all <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
            </Link>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : !recentOrders.length ? (
            <p className="font-sans text-sm text-gray-400 text-center py-4">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map(o => {
                const meta = STATUS_META[o.status] || STATUS_META.new;
                const when = o.createdAt ? new Date(o.createdAt) : null;
                return (
                  <li key={o.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to="/admin/orders"
                      className="flex items-center justify-between gap-3 hover:bg-gold/[0.03] -mx-2 px-2 py-1 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} title={meta.en} />
                        <div className="min-w-0">
                          <div className="font-sans text-sm text-jet font-medium truncate">
                            {o.customer?.name || '—'}
                          </div>
                          <div className="font-sans text-[11px] text-gray-500 truncate">
                            {o.id}{when ? ` · ${when.toLocaleDateString()}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <div className="font-sans text-sm font-bold text-jet">{formatCurrency(o.total ?? 0)}</div>
                        <div className="font-sans text-[10px] text-gray-500">{meta.en}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Inventory health hint ───────────────────────────────────── */}
      {!loading && stats && stats.totalProducts > 0 && stats.activeProducts < stats.totalProducts && (
        <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded text-sm flex items-center gap-3">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>
            {stats.totalProducts - stats.activeProducts} product{stats.totalProducts - stats.activeProducts === 1 ? '' : 's'} {stats.totalProducts - stats.activeProducts === 1 ? 'is' : 'are'} currently inactive.
          </span>
          <Link to="/admin/products" className="ms-auto font-semibold underline hover:no-underline shrink-0">
            Review
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
