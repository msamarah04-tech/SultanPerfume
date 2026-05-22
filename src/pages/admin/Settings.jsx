import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { Save, Info, Plus, Trash2 } from 'lucide-react';

const Field = ({ label, name, type = 'text', value, onChange }) => (
  <div>
    <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
    />
  </div>
);

const Settings = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    whatsappNumber: '',
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    currency: 'JOD',
    currencySymbol: 'د.أ',
    numeralSystem: 'arab',
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    socials: { instagram: '', tiktok: '', snapchat: '' },
    quantityPricing: { enabled: false, tiers: [] },
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminApi.settings.get().then(data => {
      setForm(prev => ({
        ...prev,
        ...data,
        quantityPricing: data.quantityPricing ?? prev.quantityPricing,
      }));
    }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, socials: { ...prev.socials, [name]: value } }));
  };

  const handleQpToggle = (e) => {
    const enabled = e.target.checked;
    setForm(prev => ({
      ...prev,
      quantityPricing: { ...(prev.quantityPricing || { tiers: [] }), enabled },
    }));
  };

  const handleQpTierChange = (idx, field, value) => {
    setForm(prev => {
      const tiers = [...(prev.quantityPricing?.tiers || [])];
      tiers[idx] = { ...tiers[idx], [field]: Number(value) };
      return { ...prev, quantityPricing: { ...prev.quantityPricing, tiers } };
    });
  };

  const addQpTier = () => {
    setForm(prev => {
      const tiers = [...(prev.quantityPricing?.tiers || [])];
      const maxMinQty = tiers.reduce((m, t) => Math.max(m, Number(t.minQty) || 1), 1);
      tiers.push({ minQty: maxMinQty + 1, discountPercent: 10 });
      return {
        ...prev,
        quantityPricing: { enabled: prev.quantityPricing?.enabled ?? true, tiers },
      };
    });
  };

  const removeQpTier = (idx) => {
    setForm(prev => {
      const tiers = [...(prev.quantityPricing?.tiers || [])];
      tiers.splice(idx, 1);
      return { ...prev, quantityPricing: { ...prev.quantityPricing, tiers } };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.settings.update({
        ...form,
        deliveryFee: Number(form.deliveryFee),
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
        quantityPricing: {
          enabled: !!form.quantityPricing?.enabled,
          tiers: (form.quantityPricing?.tiers || []).map(t => ({
            minQty: Math.max(1, Math.floor(Number(t.minQty) || 1)),
            discountPercent: Math.max(0, Math.min(100, Number(t.discountPercent) || 0)),
          })),
        },
      });
      showToast('Settings saved successfully', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-jet mb-8">System Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-xl text-jet mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-gold" /> Store Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="WhatsApp Number" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} />
            <Field label="Tagline (Arabic)" name="tagline" value={form.tagline} onChange={handleChange} />
            <Field label="Delivery Fee (JOD)" name="deliveryFee" type="number" value={form.deliveryFee} onChange={handleChange} />
            <Field label="Free Delivery Threshold (JOD)" name="freeDeliveryThreshold" type="number" value={form.freeDeliveryThreshold} onChange={handleChange} />
            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Numeral System</label>
              <select name="numeralSystem" value={form.numeralSystem} onChange={handleChange}
                className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none">
                <option value="arab">Arabic (٠١٢٣٤٥٦٧٨٩)</option>
                <option value="latin">Latin (0123456789)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-xl text-jet mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Contact Email" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
            <Field label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
            <div className="md:col-span-2">
              <Field label="Address" name="contactAddress" value={form.contactAddress} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-xl text-jet mb-6">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Instagram URL" name="instagram" value={form.socials?.instagram} onChange={handleSocialChange} />
            <Field label="TikTok URL" name="tiktok" value={form.socials?.tiktok} onChange={handleSocialChange} />
            <Field label="Snapchat URL" name="snapchat" value={form.socials?.snapchat} onChange={handleSocialChange} />
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-serif text-xl text-jet">Global Quantity Discount Defaults</h2>
            <label className="flex items-center gap-2 text-sm font-sans">
              <input
                type="checkbox"
                checked={!!form.quantityPricing?.enabled}
                onChange={handleQpToggle}
                className="w-4 h-4 accent-gold"
              />
              <span>Enabled</span>
            </label>
          </div>
          <p className="font-sans text-xs text-gray-500 leading-relaxed mb-6">
            Percentage discount applied to <strong>any</strong> product that does not define its own tiers.
            Example: <em>Min Qty 2 → 10% off</em> means buying 2+ of the same product cuts 10% off each unit.
            The highest matching tier wins.
          </p>

          <div className="space-y-4 mb-4">
            {(form.quantityPricing?.tiers || []).length === 0 && (
              <p className="font-sans text-xs text-gray-400 italic">No global tiers configured.</p>
            )}
            {(form.quantityPricing?.tiers || []).map((tier, idx) => (
              <div key={idx} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Min Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tier.minQty}
                    onChange={(e) => handleQpTierChange(idx, 'minQty', e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tier.discountPercent}
                    onChange={(e) => handleQpTierChange(idx, 'discountPercent', e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeQpTier(idx)}
                  className="p-3 text-gray-400 hover:text-red-500"
                  title="Remove tier"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addQpTier} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Tier
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" type="submit" isLoading={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </form>

      <div className="mt-8 bg-white p-6 border border-gray-200 shadow-sm">
        <h2 className="font-serif text-xl text-jet mb-4">Gemini AI Key (local only)</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gemini API Key</label>
            <input type="password" id="geminiApiKey"
              className="w-full border border-gray-200 px-3 py-2 font-sans text-sm focus:border-gold focus:outline-none"
              placeholder="AIzaSy..."
              defaultValue={localStorage.getItem('geminiApiKey') || ''}
              onChange={(e) => e.target.value ? localStorage.setItem('geminiApiKey', e.target.value) : localStorage.removeItem('geminiApiKey')}
            />
          </div>
        </div>
        <p className="font-sans text-xs text-gray-400 mt-2">Stored in localStorage only — never sent to the backend.</p>
      </div>
    </div>
  );
};

export default Settings;
