import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const Feedback = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);

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

  return (
    <div className="space-y-6" dir="ltr">
      <div>
        <h1 className="font-serif text-3xl text-jet flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-gold" />
          Feedback & Reviews
        </h1>
        <p className="font-sans text-xs text-gray-500 mt-1">
          Approve testimonials to show them publicly on the storefront.
        </p>
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
    </div>
  );
};

export default Feedback;
