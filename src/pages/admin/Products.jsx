import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Search, Edit, Trash2, Download, Upload } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.products.list({ limit: 200 }).then(data => setProducts(data.items)).catch(console.error);
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 font-sans text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export JSON
            </Button>
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import JSON
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-[0.1em] text-[10px]">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price (From)</th>
                <th className="px-6 py-4 font-medium">Stock</th>
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
                      <span className={product.stock <= 5 ? 'text-red-500' : 'text-jet'}>{product.stock}</span>
                    </td>
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
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
