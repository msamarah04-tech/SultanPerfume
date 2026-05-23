import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Trash2, Eye, EyeOff, Plus, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const EMPTY_FORM = { customerName: '', imageUrl: '', approved: true };

const Feedback = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    adminApi.feedback.list().then(setItems).catch(console.error);
  }, []);

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار صورة فقط', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('حجم الصورة كبير. الحد الأقصى 3 ميغابايت.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setForm(f => ({ ...f, imageUrl: e.target.result }));
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleToggleApproved = async (item) => {
    try {
      const updated = await adminApi.feedback.patch(item.id, { approved: !item.approved });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      showToast(updated.approved ? 'تم نشر التقييم' : 'تم إخفاء التقييم', 'success');
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await adminApi.feedback.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) {
      showToast('يرجى رفع صورة', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await adminApi.feedback.create({
        customerName: form.customerName.trim(),
        message: '',
        imageUrl: form.imageUrl,
        approved: form.approved,
      });
      setItems(prev => [created, ...prev]);
      setForm(EMPTY_FORM);
      setIsModalOpen(false);
      showToast('تمت إضافة التقييم بنجاح', 'success');
    } catch {
      showToast('Failed to create feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-jet flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-gold" />
            Feedback Gallery
          </h1>
          <p className="font-sans text-xs text-gray-500 mt-1">
            Upload customer feedback screenshots (e.g. from WhatsApp). Approved photos appear on the homepage.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add screenshot
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center rounded">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-sans text-sm text-gray-500">No feedback uploaded yet.</p>
          <p className="font-sans text-xs text-gray-400 mt-1">Click "Add screenshot" to upload your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded overflow-hidden flex flex-col group ${
                item.approved ? 'border-emerald-200' : 'border-gray-200 opacity-80'
              }`}
            >
              <button
                type="button"
                onClick={() => item.imageUrl && setLightboxSrc(item.imageUrl)}
                className="relative aspect-[3/4] bg-gray-50 overflow-hidden cursor-zoom-in"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.customerName || 'Customer feedback'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 p-4">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-[10px] text-center line-clamp-4" dir="rtl">{item.message}</p>
                  </div>
                )}
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  item.approved ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {item.approved ? 'Live' : 'Hidden'}
                </span>
              </button>

              <div className="p-3 flex items-center justify-between gap-2 border-t border-gray-100">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs text-jet truncate" dir="rtl">
                    {item.customerName || 'عميل كريم'}
                  </p>
                  <p className="font-sans text-[10px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleApproved(item)}
                    className={`p-1.5 border rounded transition-colors ${
                      item.approved
                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        : 'border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                    title={item.approved ? 'Hide' : 'Approve'}
                  >
                    {item.approved ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة لقطة شاشة" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5 pt-1" dir="rtl">
          {/* Photo uploader */}
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-600 mb-2">صورة التقييم *</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="border-2 border-dashed border-gray-200 hover:border-gold/60 transition-colors rounded bg-gray-50/50"
            >
              {form.imageUrl ? (
                <div className="relative">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-64 object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute top-2 left-2 bg-white/95 hover:bg-red-500 hover:text-white border border-gray-200 rounded-full p-1.5 shadow"
                    title="إزالة الصورة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gold transition-colors"
                >
                  <UploadCloud className="w-10 h-10" />
                  <span className="font-sans text-xs font-semibold">اضغط لاختيار صورة أو اسحبها هنا</span>
                  <span className="font-sans text-[10px] text-gray-400">PNG, JPG, WEBP. الحد الأقصى 3 ميغابايت.</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Customer Name (optional) */}
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-600 mb-1.5">
              اسم العميل <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              className="w-full border border-gray-200 px-3 py-2.5 font-sans text-sm outline-none focus:border-gold bg-gray-50 rounded"
              placeholder="مثال: أحمد محمد"
            />
          </div>

          {/* Approved toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="font-sans text-xs font-semibold text-gray-600">نشر التقييم مباشرة</span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, approved: !f.approved }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.approved ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.approved ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-1" dir="ltr">
            <Button type="submit" variant="primary" disabled={isSubmitting || !form.imageUrl} className="flex-1">
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التقييم'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Feedback"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Feedback;
