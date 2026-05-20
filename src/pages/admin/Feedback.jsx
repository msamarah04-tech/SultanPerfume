import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Star, Eye, EyeOff, Plus } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const EMPTY_FORM = { customerName: '', rating: 5, message: '', approved: true };

const Feedback = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminApi.feedback.list().then(setItems).catch(console.error);
  }, []);

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
    if (!form.customerName.trim() || !form.message.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await adminApi.feedback.create(form);
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
            Feedback & Reviews
          </h1>
          <p className="font-sans text-xs text-gray-500 mt-1">
            Approve testimonials to show them publicly on the storefront.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة تقييم
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-sans text-sm text-gray-500">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className={`bg-white p-6 border ${item.approved ? 'border-emerald-200' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-serif text-jet">{item.customerName}</span>
                    {item.rating && (
                      <span className="flex gap-0.5 text-gold">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-gray-700 leading-relaxed" dir="rtl">{item.message}</p>
                  <p className="font-sans text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleApproved(item)}
                    className={`p-2 border transition-colors ${item.approved ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600'}`}
                    title={item.approved ? 'Hide' : 'Approve'}
                  >
                    {item.approved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 border border-red-100 hover:bg-red-50 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة تقييم جديد" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5 pt-1" dir="rtl">

          {/* Customer Name */}
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-600 mb-1.5">اسم العميل</label>
            <input
              type="text"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              required
              minLength={2}
              className="w-full border border-gray-200 px-3 py-2.5 font-sans text-sm outline-none focus:border-gold bg-gray-50"
              placeholder="مثال: أحمد محمد"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-600 mb-1.5">التقييم</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`p-1 transition-colors ${n <= form.rating ? 'text-gold' : 'text-gray-300 hover:text-gold/60'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-600 mb-1.5">نص التقييم</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              minLength={5}
              rows={4}
              className="w-full border border-gray-200 px-3 py-2.5 font-sans text-sm outline-none focus:border-gold bg-gray-50 resize-none"
              placeholder="اكتب تجربة العميل هنا..."
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
            <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التقييم'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Feedback;
