import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const AdminOffers = () => {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  // Form states
  const [type, setType] = useState('bundle');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [perfumeCount, setPerfumeCount] = useState(5);
  const [price, setPrice] = useState(25);
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(5);
  const [promoCode, setPromoCode] = useState('');
  const [active, setActive] = useState(true);
  const [image, setImage] = useState('');

  useEffect(() => {
    adminApi.offers.list().then(setOffers).catch(console.error);
  }, []);

  const openAddModal = () => {
    setEditingOffer(null);
    setType('bundle');
    setTitleAr('');
    setTitleEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setPerfumeCount(5);
    setPrice(25);
    setDiscountPercentage(10);
    setDiscountAmount(5);
    setPromoCode('');
    setActive(true);
    setImage('/offer.png');
    setIsModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setType(offer.type);
    setTitleAr(offer.title);
    setTitleEn('');
    setDescriptionAr(offer.description);
    setDescriptionEn('');
    setPerfumeCount(offer.perfumeCount ?? 5);
    setPrice(offer.price ?? 25);
    setDiscountPercentage(offer.discountPercent || 10);
    setDiscountAmount(offer.discountAmount || 5);
    setPromoCode(offer.promoCode || '');
    setActive(offer.active);
    setImage(offer.imageUrl || '/offer.png');
    setIsModalOpen(true);
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العرض؟')) return;
    try {
      await adminApi.offers.delete(id);
      setOffers(prev => prev.filter(o => o.id !== id));
      showToast('تم حذف العرض بنجاح', 'info');
    } catch { showToast('Failed to delete offer', 'error'); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 2 ميغابايت لتجنب امتلاء ذاكرة المتصفح.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      showToast('تم تحميل صورة العرض بنجاح!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!titleAr || !descriptionAr) {
      showToast('يرجى ملء البيانات العربية الأساسية', 'error');
      return;
    }

    if ((type === 'percentage' || type === 'fixed') && !promoCode) {
      showToast('يرجى كتابة كود الخصم لتفعيل الكوبون', 'error');
      return;
    }

    const offerData = {
      title: titleAr,
      description: descriptionAr,
      type,
      active,
      perfumeCount: type === 'bundle' ? Number(perfumeCount) : null,
      price: type === 'bundle' ? Number(price) : null,
      imageUrl: type === 'bundle' ? (image || '/offer.png') : '',
      promoCode: (type === 'percentage' || type === 'fixed') ? promoCode.toUpperCase().trim() : null,
      discountPercent: type === 'percentage' ? Number(discountPercentage) : null,
      discountAmount: type === 'fixed' ? Number(discountAmount) : null,
      productIds: [],
    };

    try {
      if (editingOffer) {
        const updated = await adminApi.offers.update(editingOffer.id, offerData);
        setOffers(prev => prev.map(o => o.id === editingOffer.id ? updated : o));
        showToast('تم تحديث العرض بنجاح', 'success');
      } else {
        const created = await adminApi.offers.create(offerData);
        setOffers(prev => [created, ...prev]);
        showToast('تمت إضافة العرض الجديد بنجاح', 'success');
      }
      setIsModalOpen(false);
    } catch { showToast('Failed to save offer', 'error'); }
  };

  return (
    <div className="space-y-6 text-start" dir="ltr">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-jet">Offers Management</h1>
          <p className="text-sm text-gray-500">Configure bundles, percentage discount codes, or fixed JOD coupons.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gold hover:bg-gold-light text-white font-sans text-xs font-semibold px-4 py-2.5 rounded transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Offer
        </button>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center rounded">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-sans text-sm text-gray-500">No active offers. Click "Add New Offer" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div 
              key={offer.id} 
              className={`bg-white border rounded p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative ${
                offer.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Type Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded capitalize ${
                  offer.type === 'bundle' 
                    ? 'bg-gold/10 text-gold' 
                    : offer.type === 'percentage' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {offer.type === 'bundle' ? 'Bundle Package' : offer.type === 'percentage' ? 'Percentage' : 'Fixed Discount'}
                </span>
                
                <span className={`w-2.5 h-2.5 rounded-full ${offer.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>

              <div className="space-y-3">
                {offer.type === 'bundle' && (
                  <div className="w-full h-28 bg-gray-50 border border-gray-150 rounded overflow-hidden flex items-center justify-center shrink-0 mt-4 shadow-sm">
                    <img 
                      src={offer.imageUrl || '/offer.png'} 
                      alt={offer.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="pt-2">
                  <h3 className="font-bold text-jet font-sans">{offer.title}</h3>
                  <h4 className="text-xs text-gray-400 font-sans mt-0.5">{offer.title}</h4>
                </div>

                <div className="bg-gray-50 p-3 rounded text-xs space-y-1.5 border border-gray-100">
                  {offer.type === 'bundle' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Price:</span>
                        <span className="font-bold text-gold">{offer.price} JOD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Perfumes Allowed:</span>
                        <span className="font-bold text-jet">{offer.perfumeCount} bottles</span>
                      </div>
                    </>
                  )}
                  {(offer.type === 'percentage' || offer.type === 'fixed') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Promo Code:</span>
                        <span className="font-bold text-jet bg-gray-200 px-1.5 rounded">{offer.promoCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Discount Value:</span>
                        <span className="font-bold text-emerald-600">
                          {offer.type === 'percentage' ? `${offer.discountPercent}%` : `${offer.discountAmount} JOD`}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-sans line-clamp-2">{offer.description}</p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(offer)}
                  className="p-2 border border-gray-200 hover:border-gold hover:text-gold text-gray-400 transition-colors rounded"
                  title="Edit Offer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteOffer(offer.id)}
                  className="p-2 border border-gray-200 hover:border-red-500 hover:text-red-500 text-gray-400 transition-colors rounded"
                  title="Delete Offer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-jet/60 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-jet">
                {editingOffer ? 'Edit Offer Details' : 'Create New Offer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Offer Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                >
                  <option value="bundle">Bundle Pack (Buy X Perfumes for Fixed JOD)</option>
                  <option value="percentage">Percentage Discount Code (X% Off Coupon)</option>
                  <option value="fixed">Fixed Amount Discount Code (X JOD Off Coupon)</option>
                </select>
              </div>

              {/* Title Input - AR */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title (Arabic) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عرض الصيف الاستثنائي"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none text-right"
                  dir="rtl"
                />
              </div>

              {/* Title Input - EN */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional Summer Offer"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                />
              </div>

              {/* Description Input - AR */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description (Arabic) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: اختر 5 عطور صيفية منعشة بسعر 25 دينار فقط مع توصيل مجاني"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none text-right"
                  dir="rtl"
                />
              </div>

              {/* Description Input - EN */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Select any 5 refreshing perfumes for 25 JOD with free shipping"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                />
              </div>

              {/* Offer Image Uploader - Only for Bundle Packages */}
              {type === 'bundle' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500">صورة العرض (Offer Image)</label>
                  
                  {/* Image Preview and Upload Area */}
                  <div className="flex items-center gap-4 p-4 border border-gray-200 bg-gray-50 rounded">
                    <div className="w-20 h-20 border border-gray-200 bg-white overflow-hidden shrink-0 flex items-center justify-center relative rounded shadow-sm">
                      <img 
                        src={image || '/offer.png'} 
                        alt="Offer preview" 
                        className="w-full h-full object-contain p-1" 
                      />
                    </div>
                    
                    <div className="flex-grow space-y-1 text-start">
                      <input
                        type="file"
                        id="offer-image-input"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('offer-image-input').click()}
                        className="px-3 py-1.5 bg-jet hover:bg-gold text-white font-sans text-[10px] font-bold rounded transition-colors"
                      >
                        Upload Image
                      </button>
                      <p className="text-[9px] text-gray-400 font-sans leading-relaxed">
                        PNG, JPG, WEBP. Max 2MB. Recommended: square or landscape.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields based on Type */}
              {type === 'bundle' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Perfumes in Bundle</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={perfumeCount}
                      onChange={(e) => setPerfumeCount(e.target.value)}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fixed Bundle Price (JOD)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {type === 'percentage' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Discount Percentage (%)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Promo Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUMMER20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none uppercase"
                    />
                  </div>
                </div>
              )}

              {type === 'fixed' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Discount Amount (JOD)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Promo Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SAVE10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="w-full border border-gray-200 rounded p-2 focus:border-gold focus:outline-none uppercase"
                    />
                  </div>
                </div>
              )}

              {/* Status Switch */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active-switch"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold accent-gold"
                />
                <label htmlFor="active-switch" className="text-xs font-semibold text-gray-500 select-none">
                  Make this offer live and active instantly
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal font-sans text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:bg-gold-light text-white font-sans text-xs font-semibold rounded transition-colors"
                >
                  {editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
