import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Search, Edit, Trash2, Download, Upload, Layers, X } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [tiersModalOpen, setTiersModalOpen] = useState(false);
  const [bulkTiers, setBulkTiers] = useState([
    { minQty: 2, totalPrice: 70 },
    { minQty: 3, totalPrice: 90 },
  ]);
  const [bulkExcessUnit, setBulkExcessUnit] = useState(5);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.products.list({ limit: 200 }).then(data => setProducts(data.items)).catch(console.error);
    // Pre-load the existing cart-wide tier so admin sees what's currently active
    adminApi.settings.get().then(s => {
      const cqt = s?.cartQuantityTiers;
      if (cqt && Array.isArray(cqt.tiers) && cqt.tiers.length) {
        setBulkTiers(cqt.tiers.map(t => ({
          minQty: Number(t.minQty),
          totalPrice: Number(t.totalPrice),
        })));
      }
      if (cqt && cqt.excessUnitPrice != null) setBulkExcessUnit(Number(cqt.excessUnitPrice));
    }).catch(() => {});
  }, []);

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await adminApi.products.delete(productToDelete.id);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setDeleteModalOpen(false);
      showToast(`${productToDelete.name} deleted successfully.`);
    } catch {
      showToast('Failed to delete product.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/admin/products/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Products exported successfully.');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) { showToast('Invalid JSON format.', 'error'); return; }
        const result = await adminApi.products.import(importedData);
        showToast(`Imported ${result.imported} products successfully.`);
        const fresh = await adminApi.products.list({ limit: 200 });
        setProducts(fresh.items);
      } catch {
        showToast('Import failed.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const refreshProducts = async () => {
    const fresh = await adminApi.products.list({ limit: 200 });
    setProducts(fresh.items);
  };

  const updateBulkTier = (idx, field, value) => {
    setBulkTiers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: Number(value) };
      return next;
    });
  };

  const addBulkTier = () => {
    setBulkTiers(prev => {
      const maxQty = prev.reduce((m, t) => Math.max(m, Number(t.minQty) || 1), 1);
      const lastPrice = prev[prev.length - 1]?.totalPrice ?? 0;
      return [...prev, { minQty: maxQty + 1, totalPrice: lastPrice }];
    });
  };

  const removeBulkTier = (idx) => {
    setBulkTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const applyBulkTiers = async (mode) => {
    if (mode === 'set' && bulkTiers.length === 0) {
      showToast('Add at least one tier first.', 'error');
      return;
    }
    setBulkBusy(true);
    try {
      const payload = mode === 'set'
        ? {
            mode: 'set',
            tiers: bulkTiers.map(t => ({
              minQty: Math.max(1, Math.floor(Number(t.minQty) || 1)),
              totalPrice: Math.max(0, Number(t.totalPrice) || 0),
            })),
            excessUnitPrice: Math.max(0, Number(bulkExcessUnit) || 0),
          }
        : { mode: 'clear', tiers: [], excessUnitPrice: Math.max(0, Number(bulkExcessUnit) || 0) };
      await adminApi.products.bulkTiers(payload);
      showToast(
        mode === 'set'
          ? 'Cart-wide tier saved. Applies to mixed perfumes in any cart.'
          : 'Cart-wide tier cleared.',
      );
      setTiersModalOpen(false);
      await refreshProducts();
    } catch (err) {
      showToast(err.message || 'Bulk tier update failed.', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const priceOf = (p) => (p.sizes?.length ? Math.min(...p.sizes.map(s => s.price)) : 0);

  const filteredProducts = products
    .filter(p => {
      if (search) {
        const q = search.toLowerCase();
        const inSearch =
          p.name.toLowerCase().includes(q) ||
          (p.nameAr || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!inSearch) return false;
      }
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'draft' && p.active) return false;
      if (featuredFilter === 'featured' && !p.featured) return false;
      if (featuredFilter === 'not-featured' && p.featured) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':  return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc':  return priceOf(a) - priceOf(b);
        case 'price-desc': return priceOf(b) - priceOf(a);
        case 'oldest':    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'newest':
        default:          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const filtersActive =
    search !== '' ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    featuredFilter !== 'all' ||
    sortBy !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setFeaturedFilter('all');
    setSortBy('newest');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-jet mb-2">Products</h1>
          <p className="font-sans text-sm text-gray-500">Manage your fragrance catalog</p>
        </div>
        <Link to="/admin/products/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, Arabic name, brand…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 font-sans text-sm outline-none focus:border-gold"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setTiersModalOpen(true)} className="flex items-center gap-2">
                <Layers className="w-4 h-4" /> Bulk Tiers
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export JSON
              </Button>
              <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Import JSON
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 font-sans text-xs px-3 py-2 rounded outline-none focus:border-gold"
            >
              <option value="all">All categories</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 font-sans text-xs px-3 py-2 rounded outline-none focus:border-gold"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="draft">Drafts only</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 font-sans text-xs px-3 py-2 rounded outline-none focus:border-gold"
            >
              <option value="all">Featured: any</option>
              <option value="featured">Featured only</option>
              <option value="not-featured">Not featured</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border border-gray-200 font-sans text-xs px-3 py-2 rounded outline-none focus:border-gold"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="price-asc">Price (low → high)</option>
              <option value="price-desc">Price (high → low)</option>
            </select>

            {filtersActive && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-sans text-gray-500 hover:text-red-500 px-2 py-2"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}

            <span className="ml-auto text-xs font-sans text-gray-500">
              Showing <strong className="text-jet">{filteredProducts.length}</strong> of {products.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-[0.1em] text-[10px]">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price (From)</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const startingPrice = Math.min(...product.sizes.map(s => s.price));
                return (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 shrink-0">
                          <img src={product.images[0] || ''} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-jet">{product.name}</p>
                          {product.featured && <span className="text-[10px] text-gold uppercase tracking-[0.1em]">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{product.category}</td>
                    <td className="px-6 py-4 text-jet">{formatCurrency(startingPrice)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-[0.1em] rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/edit/${product.id}`} className="p-2 text-gray-400 hover:text-gold transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => confirmDelete(product)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {filtersActive
                      ? 'No products match the current filters.'
                      : 'No products found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={tiersModalOpen} onClose={() => setTiersModalOpen(false)} title="Cart-wide Bundle Tiers">
        <p className="font-sans text-sm text-gray-600 mb-4">
          One cart-wide deal across all perfumes. Counts total bottles in the cart (mixing different
          perfumes is OK). When a tier matches, that <strong>total price</strong> replaces the cart subtotal.
          Example: tier qty 2 → 70 JOD means any 2 bottles in the cart cost 70 JOD total.
        </p>

        {(() => {
          const sorted = [...bulkTiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
          const inverted = sorted.some((t, i) =>
            i > 0 && Number(t.totalPrice) < Number(sorted[i - 1].totalPrice),
          );
          if (!inverted) return null;
          return (
            <p className="font-sans text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 mb-4">
              Warning: a higher-quantity tier has a LOWER total than a lower one — buying more would
              cost less overall. Did you mean to increase the total?
            </p>
          );
        })()}

        <div className="mb-4">
          <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Tiers
          </label>
          <div className="space-y-3">
            {bulkTiers.length === 0 && (
              <p className="font-sans text-xs text-gray-400 italic">No tiers — add at least one to apply.</p>
            )}
            {bulkTiers.map((tier, idx) => (
              <div key={idx} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block font-sans text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                    Min Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tier.minQty}
                    onChange={(e) => updateBulkTier(idx, 'minQty', e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-sans text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                    Total Cart Price (JOD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={tier.totalPrice}
                    onChange={(e) => updateBulkTier(idx, 'totalPrice', e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeBulkTier(idx)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Remove tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addBulkTier}
            className="mt-3 inline-flex items-center gap-1 text-xs font-sans text-gold hover:underline"
          >
            <Plus className="w-3 h-3" /> Add tier
          </button>
        </div>

        <div className="mb-2">
          <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Price per extra bottle past the highest tier (JOD)
          </label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={bulkExcessUnit}
            onChange={(e) => setBulkExcessUnit(e.target.value)}
            className="w-40 border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
          />
          <p className="font-sans text-xs text-gray-500 mt-1">
            Bottles beyond the largest tier&apos;s Min Qty cost this much each. Default is 5 JOD.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => applyBulkTiers('clear')}
            className="text-xs font-sans text-red-500 hover:underline disabled:opacity-50 self-start"
          >
            Disable cart-wide tier
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setTiersModalOpen(false)} disabled={bulkBusy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => applyBulkTiers('set')} isLoading={bulkBusy}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p className="font-sans text-gray-600 mb-6">
          Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 border-red-500">Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
