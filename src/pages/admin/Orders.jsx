import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../lib/format';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Search, Eye, Download, FileSpreadsheet, CalendarDays, X, CheckSquare, User, Phone, MapPin, StickyNote, Package, Sparkles, Clock } from 'lucide-react';

function parseBundleItemNames(sizeStr) {
  const match = sizeStr?.match(/\[([^\]]+)\]/);
  if (!match) return null;
  return match[1].split(',').map(s => s.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean);
}

const STATUS_BG_LIGHT = {
  new:       'bg-amber-50 border-amber-200',
  contacted: 'bg-blue-50 border-blue-200',
  confirmed: 'bg-indigo-50 border-indigo-200',
  fulfilled: 'bg-green-50 border-green-200',
  cancelled: 'bg-red-50 border-red-200',
};
const STATUS_DOT = {
  new:       'bg-amber-400',
  contacted: 'bg-blue-400',
  confirmed: 'bg-indigo-400',
  fulfilled: 'bg-green-400',
  cancelled: 'bg-red-400',
};

const STATUS_OPTIONS = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

const STATUS_STYLE = {
  new:       'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const toIsoDate = (d) => d.toISOString().slice(0, 10);
const TODAY     = toIsoDate(new Date());
const YESTERDAY = toIsoDate(new Date(Date.now() - 86_400_000));

const QUICK_FILTERS = [
  { label: 'All',        from: '',                                              to: '' },
  { label: 'Today',      from: TODAY,                                           to: TODAY },
  { label: 'Yesterday',  from: YESTERDAY,                                       to: YESTERDAY },
  { label: 'This Week',  from: toIsoDate(new Date(Date.now() - 6 * 86_400_000)), to: TODAY },
  { label: 'This Month', from: toIsoDate(new Date(Date.now() - 29 * 86_400_000)), to: TODAY },
];

function formatDayLabel(dateKey) {
  if (dateKey === TODAY)     return 'Today';
  if (dateKey === YESTERDAY) return 'Yesterday';
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Indeterminate checkbox
function Checkbox({ checked, indeterminate, onChange, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`w-4 h-4 rounded border-gray-300 text-gold accent-yellow-600 cursor-pointer ${className}`}
    />
  );
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two-tone chime: high then low
    [[880, 0, 0.15], [660, 0.18, 0.3]].forEach(([freq, start, end]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + end);
    });
  } catch { /* audio not available */ }
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingSelected, setIsExportingSelected] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.orders.list({ limit: 200 }).then(data => setOrders(data.items)).catch(console.error);
  }, []);

  // Real-time: AdminLayout's SSE connection dispatches this event
  useEffect(() => {
    const onNewOrder = (e) => {
      const order = e.detail;
      setOrders(prev => prev.find(o => o.id === order.id) ? prev : [order, ...prev]);
      showToast(`طلب جديد من ${order.customer.name} — ${order.id}`, 'success');
      playNotificationSound();
    };
    window.addEventListener('admin:new-order', onNewOrder);
    return () => window.removeEventListener('admin:new-order', onNewOrder);
  }, [showToast]);

  // Clear selection when filter changes
  useEffect(() => { setSelectedIds(new Set()); }, [search, dateFrom, dateTo]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await adminApi.orders.patch(id, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      showToast(`Order status updated to ${newStatus}`);
      if (selectedOrder?.id === id) setSelectedOrder(updated);
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const dateKey = o.createdAt.slice(0, 10);
    if (dateFrom && dateKey < dateFrom) return false;
    if (dateTo   && dateKey > dateTo)   return false;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  });

  // Group by day, newest first
  const groupedByDate = {};
  filteredOrders.forEach(o => {
    const dk = o.createdAt.slice(0, 10);
    (groupedByDate[dk] ??= []).push(o);
  });
  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // ── Selection helpers ──────────────────────────────────────────────────────
  const filteredIds = filteredOrders.map(o => o.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someSelected = filteredIds.some(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Exports ───────────────────────────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

  const downloadBlob = async (url, filename) => {
    const token = sessionStorage.getItem('adminToken');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl; a.download = filename; a.click();
    URL.revokeObjectURL(objUrl);
  };

  const handleExportCSV = async () => {
    try {
      await downloadBlob(`${API_BASE}/admin/orders/export`, 'orders.csv');
    } catch { showToast('Export failed', 'error'); }
  };

  const buildExcelUrl = (ids) => {
    const params = new URLSearchParams();
    if (ids && ids.length) {
      params.set('ids', ids.join(','));
    } else {
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to',   dateTo);
    }
    const qs = params.toString();
    return `${API_BASE}/admin/orders/export/excel${qs ? `?${qs}` : ''}`;
  };

  const handleExportExcel = async (ids) => {
    const setter = ids ? setIsExportingSelected : setIsExportingExcel;
    setter(true);
    try {
      await downloadBlob(buildExcelUrl(ids), `al-sultan-orders-${TODAY}.xlsx`);
    } catch { showToast('Excel export failed', 'error'); }
    finally { setter(false); }
  };

  const hasDateFilter   = dateFrom || dateTo;
  const activeQuick     = QUICK_FILTERS.find(f => f.from === dateFrom && f.to === dateTo);
  const selectedList    = [...selectedIds];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-jet mb-2">Orders</h1>
          <p className="font-sans text-sm text-gray-500">Manage customer orders</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3">

          {/* Row 1: search + export buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 font-sans text-sm outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => handleExportExcel(null)}
                disabled={isExportingExcel || orders.length === 0}
                className="flex items-center gap-2"
                title={orders.length === 0 ? 'No orders to export' : ''}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isExportingExcel ? 'Exporting…' : 'Export to Excel'}
              </Button>
            </div>
          </div>

          {/* Row 2: quick filters + custom date range */}
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
            {QUICK_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => { setDateFrom(f.from); setDateTo(f.to); }}
                className={`px-3 py-1 font-sans text-xs rounded-full border transition-colors ${
                  activeQuick?.label === f.label
                    ? 'bg-jet text-white border-jet'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="flex items-center gap-1 ms-1">
              <input type="date" value={dateFrom} max={dateTo || TODAY}
                onChange={e => setDateFrom(e.target.value)}
                className="font-sans text-xs border border-gray-200 px-2 py-1 rounded outline-none focus:border-gold bg-gray-50" />
              <span className="text-gray-400 text-xs">–</span>
              <input type="date" value={dateTo} min={dateFrom} max={TODAY}
                onChange={e => setDateTo(e.target.value)}
                className="font-sans text-xs border border-gray-200 px-2 py-1 rounded outline-none focus:border-gold bg-gray-50" />
            </div>
            {hasDateFilter && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1 px-2 py-1 font-sans text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-full transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            {filteredOrders.length > 0 && (
              <span className="font-sans text-xs text-gray-400 ms-auto">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {hasDateFilter && ' in range'}
              </span>
            )}
          </div>
        </div>

        {/* ── Selection action bar (appears when items are checked) ─────── */}
        {selectedList.length > 0 && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-sans text-sm text-yellow-800">
              <CheckSquare className="w-4 h-4" />
              <span><strong>{selectedList.length}</strong> order{selectedList.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => handleExportExcel(selectedList)}
                disabled={isExportingSelected}
                className="flex items-center gap-2 border-yellow-400 text-yellow-800 hover:bg-yellow-100"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isExportingSelected ? 'Exporting…' : 'Export Selected to Excel'}
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 px-2 py-1 font-sans text-xs text-yellow-700 hover:text-red-500 border border-yellow-300 rounded-full transition-colors"
              >
                <X className="w-3 h-3" /> Clear selection
              </button>
            </div>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-[0.1em] text-[10px]">
              <tr>
                <th className="pl-6 pr-3 py-4 w-8">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-4 font-medium">Order ID</th>
                <th className="px-3 py-4 font-medium">Time</th>
                <th className="px-3 py-4 font-medium">Customer</th>
                <th className="px-3 py-4 font-medium">Total</th>
                <th className="px-3 py-4 font-medium">Status</th>
                <th className="px-3 py-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {sortedDateKeys.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-sans text-sm">
                    {hasDateFilter ? 'No orders found for the selected period.' : 'No orders yet.'}
                  </td>
                </tr>
              )}

              {sortedDateKeys.map(dateKey => (
                <React.Fragment key={dateKey}>
                  {/* Day history header */}
                  <tr>
                    <td colSpan="7" className="px-6 py-2.5 bg-gray-50 border-t border-b border-gray-200">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        <CalendarDays className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span>{formatDayLabel(dateKey)}</span>
                        <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                          — {groupedByDate[dateKey].length} order{groupedByDate[dateKey].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {groupedByDate[dateKey].map(order => {
                    const isChecked = selectedIds.has(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${isChecked ? 'bg-yellow-50/60' : order.status === 'new' ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="pl-6 pr-3 py-4">
                          <Checkbox
                            checked={isChecked}
                            indeterminate={false}
                            onChange={() => toggleOne(order.id)}
                          />
                        </td>
                        <td className="px-3 py-4 font-medium text-jet">#{order.id}</td>
                        <td className="px-3 py-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-jet">{order.customer.name}</p>
                          <p className="text-xs text-gray-500">{order.customer.phone}</p>
                        </td>
                        <td className="px-3 py-4 text-jet">{formatCurrency(order.total)}</td>
                        <td className="px-3 py-4">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs uppercase tracking-[0.1em] px-2 py-1 rounded-full outline-none border-none ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-4 text-right pr-6">
                          <button
                            onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-gold transition-colors inline-block"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Order #${selectedOrder?.id}`} maxWidth="max-w-xl">
        {selectedOrder && (() => {
          const initials = selectedOrder.customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const placedAt = new Date(selectedOrder.createdAt);
          return (
            <div className="font-sans -mx-4 -mt-4">

              {/* ── Status banner ─────────────────────────────────── */}
              <div className={`flex items-center justify-between px-6 py-3 border-b ${STATUS_BG_LIGHT[selectedOrder.status] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selectedOrder.status] || 'bg-gray-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${STATUS_STYLE[selectedOrder.status]?.split(' ')[1] || 'text-gray-600'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {placedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {placedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">

                {/* ── Customer card ─────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Customer
                    </span>
                  </div>
                  <div className="p-4">
                    {/* Name row */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gold">{initials}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-jet text-sm">{selectedOrder.customer.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Customer</p>
                      </div>
                      <div className="ms-auto">
                        <select
                          value={selectedOrder.status}
                          onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                          className={`text-xs uppercase tracking-[0.1em] px-2 py-1 rounded-full outline-none border-none cursor-pointer ${STATUS_STYLE[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <a
                        href={`tel:${selectedOrder.customer.phone}`}
                        className="flex items-center gap-3 text-sm group"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-jet group-hover:text-green-600 transition-colors font-medium" dir="ltr">
                          {selectedOrder.customer.phone}
                        </span>
                      </a>

                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-gray-600 leading-relaxed">{selectedOrder.customer.address}</span>
                      </div>

                      {selectedOrder.customer.notes && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <span className="text-gray-600 italic leading-relaxed">{selectedOrder.customer.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Items ─────────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      <Package className="w-3 h-3" /> Items ({selectedOrder.items.length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {selectedOrder.items.map((item, idx) => {
                      const isBundle = item.productId?.startsWith('bundle:');
                      const bundleNames = isBundle ? parseBundleItemNames(item.size) : null;
                      return (
                        <div key={`${item.productId}-${item.size}-${idx}`} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <span className="mt-0.5 w-6 h-6 bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center rounded shrink-0">
                                {item.quantity}×
                              </span>
                              <div className="min-w-0">
                                {isBundle && (
                                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[8px] font-bold px-1.5 py-0.5 border border-gold/20 mb-1">
                                    <Sparkles className="w-2 h-2" /> Bundle
                                  </span>
                                )}
                                <p className="text-sm font-medium text-jet leading-tight">{item.name}</p>
                                {!isBundle && (
                                  <p className="text-[10px] text-gray-400 mt-0.5"><bdi>{item.size}</bdi></p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-jet">{formatCurrency(item.lineTotal)}</p>
                              <p className="text-[10px] text-gray-400">{formatCurrency(item.price)} each</p>
                            </div>
                          </div>

                          {/* Bundle perfume list */}
                          {bundleNames && (
                            <div className="mt-3 ms-9 border border-gold/15 bg-[#FBF8F0] divide-y divide-gold/10 rounded-sm">
                              {bundleNames.map((name, i) => (
                                <div key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                                  <span className="w-4 h-4 rounded-full bg-gold text-white text-[8px] font-bold flex items-center justify-center shrink-0 font-mono">
                                    {i + 1}
                                  </span>
                                  <span className="text-xs text-jet">{name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Totals ────────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-jet">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-500">Delivery</span>
                      <span className={selectedOrder.deliveryFee === 0 ? 'text-green-600 font-medium text-xs' : 'text-jet'}>
                        {selectedOrder.deliveryFee === 0 ? 'Free' : formatCurrency(selectedOrder.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-4 bg-gray-50">
                      <span className="text-sm font-bold text-jet">Total</span>
                      <span className="text-xl font-bold text-gold">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Orders;
