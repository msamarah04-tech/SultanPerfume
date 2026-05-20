import { useState, useEffect } from 'react';
import { LayoutDashboard, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const DEFAULT_SECTIONS = ['hero', 'featured', 'bundle_offer', 'testimonials'];

const SECTION_META = {
  hero: {
    label: 'Hero — البطل الرئيسي',
    description: 'الفيديو المتحرك مع بانورامات المنتجات',
    color: 'bg-jet text-white',
    dot: 'bg-gold',
  },
  featured: {
    label: 'Featured — المجموعة المميزة',
    description: 'شبكة المنتجات المميزة + الأكثر مبيعاً',
    color: 'bg-ivory text-jet border border-gold/20',
    dot: 'bg-gold',
  },
  bundle_offer: {
    label: 'Special Offer — العروض الخاصة',
    description: 'لافتة العرض الحصري + قصتنا',
    color: 'bg-white text-jet border border-gold/20',
    dot: 'bg-amber-500',
  },
  testimonials: {
    label: 'Testimonials — التقييمات',
    description: 'آراء العملاء وتقييماتهم',
    color: 'bg-white text-jet border border-gold/20',
    dot: 'bg-emerald-500',
  },
};

const HomepageLayout = () => {
  const { showToast } = useToast();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    adminApi.settings.get()
      .then(data => {
        if (Array.isArray(data.homeSections) && data.homeSections.length === 4) {
          setSections(data.homeSections);
        }
      })
      .catch(console.error);
  }, []);

  const move = (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.settings.update({ homeSections: sections });
      showToast('تم حفظ ترتيب الأقسام بنجاح', 'success');
      setIsDirty(false);
    } catch {
      showToast('Failed to save section order', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setIsDirty(true);
  };

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-jet flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-gold" />
            Homepage Layout
          </h1>
          <p className="font-sans text-xs text-gray-500 mt-1">
            Drag sections up or down to reorder the homepage. Changes apply immediately after saving.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty}>
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Order'}
          </Button>
        </div>
      </div>

      {/* Section order list */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Section Order (top = first on page)
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {sections.map((key, idx) => {
            const meta = SECTION_META[key];
            if (!meta) return null;
            return (
              <div key={key} className="flex items-center gap-4 px-5 py-4">
                {/* Position number */}
                <span className="w-6 h-6 rounded-full bg-gold/10 text-gold font-bold font-sans text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                {/* Section card preview */}
                <div className={`flex-1 px-4 py-3 rounded-sm text-sm flex items-start gap-3 ${meta.color}`}>
                  <span className={`w-2 h-2 rounded-full ${meta.dot} mt-1 shrink-0`} />
                  <div className="min-w-0">
                    <p className="font-serif font-semibold leading-tight">{meta.label}</p>
                    <p className="font-sans text-xs opacity-60 mt-0.5">{meta.description}</p>
                  </div>
                </div>

                {/* Up/Down controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 border border-gray-200 text-gray-400 hover:text-gold hover:border-gold/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 border border-gray-200 text-gray-400 hover:text-gold hover:border-gold/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed section notice */}
      <div className="bg-amber-50 border border-amber-200 px-5 py-4 rounded-sm">
        <p className="font-sans text-xs text-amber-800 leading-relaxed">
          <strong>Note:</strong> The Newsletter section always appears at the bottom of the page and cannot be reordered.
          The Hero section uses scroll-driven animation and works best when placed first.
        </p>
      </div>
    </div>
  );
};

export default HomepageLayout;
