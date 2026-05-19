import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, Trash2, Plus, UploadCloud, X, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { adminApi } from '../../lib/api';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNew = !id || id === 'new';

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'unisex',
    stock: 0,
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    featured: false,
    active: true,
    images: [],
    sizes: [{ size: '50ml', price: 0 }]
  });

  useEffect(() => {
    if (!isNew) {
      adminApi.products.list({ limit: 1 }).then(() => {}) // ensure auth
        .catch(() => {});
      // Fetch product from API
      fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/admin/products/${id}`,
        { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } }
      )
        .then(r => r.json())
        .then(json => {
          if (json.ok) setFormData(json.data);
          else { showToast('Product not found', 'error'); navigate('/admin/products'); }
        })
        .catch(() => { showToast('Failed to load product', 'error'); navigate('/admin/products'); });
    }
    // for new products, id will be assigned by the server
  }, [id, isNew, navigate, showToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = field === 'price' ? Number(value) : value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: 0 }]
    }));
  };

  const removeSize = (index) => {
    if (formData.sizes.length <= 1) return;
    const newSizes = [...formData.sizes];
    newSizes.splice(index, 1);
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total size limit roughly 4MB
    let totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 4 * 1024 * 1024) {
      showToast("Images exceed 4MB total size limit for local storage.", "error");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, event.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = null; // reset
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleAIGenerate = async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      showToast("Please save your Gemini API Key in Settings first.", "error");
      return;
    }
    if (!aiPrompt) {
      showToast("Please enter an image description.", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: aiPrompt,
        config: {
          responseModalities: ['IMAGE'],
          responseFormat: {
            image: {
              aspectRatio: '1:1',
              imageSize: '1K'
            }
          }
        }
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData) {
        // GenAI SDK returns base64 in inlineData.data, need to prefix for img tag
        const mimeType = part.inlineData.mimeType || 'image/png';
        const base64Image = `data:${mimeType};base64,${part.inlineData.data}`;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64Image]
        }));
        showToast("AI Image generated successfully!");
        setAiPrompt('');
      } else {
        throw new Error("No image data returned.");
      }
    } catch (error) {
      showToast(`AI Generation failed: ${error.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.sizes.length === 0 || !formData.sizes[0].size) {
      showToast('Please add at least one valid size.', 'error');
      return;
    }

    try {
      if (isNew) {
        await adminApi.products.create({ ...formData, sizes: formData.sizes });
      } else {
        await adminApi.products.update(id, formData);
      }
      showToast(`Product ${isNew ? 'created' : 'updated'} successfully.`);
      navigate('/admin/products');
    } catch (err) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/products" className="p-2 text-gray-500 hover:text-jet transition-colors bg-white rounded shadow-sm border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-jet">{isNew ? 'Add New Product' : 'Edit Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Details */}
        <div className="flex-grow space-y-6">
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-xl text-jet mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <Input 
                label="Product Name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <Input 
                label="Description" 
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-sans uppercase text-[10px] tracking-[0.1em] text-gray-500 block mb-1">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 p-3 font-sans text-sm outline-none focus:border-gold"
                  >
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <Input 
                  label="Stock Quantity" 
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-xl text-jet mb-6">Fragrance Profile</h2>
            <div className="space-y-4">
              <Input 
                label="Top Notes" 
                name="topNotes"
                value={formData.topNotes}
                onChange={handleChange}
                placeholder="e.g. Bergamot, Lemon"
              />
              <Input 
                label="Heart Notes" 
                name="heartNotes"
                value={formData.heartNotes}
                onChange={handleChange}
                placeholder="e.g. Jasmine, Rose"
              />
              <Input 
                label="Base Notes" 
                name="baseNotes"
                value={formData.baseNotes}
                onChange={handleChange}
                placeholder="e.g. Amber, Musk, Vanilla"
              />
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-xl text-jet mb-6">Sizes & Pricing</h2>
            
            <div className="space-y-4 mb-4">
              {formData.sizes.map((sizeObj, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-grow">
                    <Input 
                      placeholder="Size (e.g. 50ml)"
                      value={sizeObj.size}
                      onChange={(e) => handleSizeChange(idx, 'size', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-grow">
                    <Input 
                      type="number"
                      placeholder="Price"
                      min="0"
                      value={sizeObj.price}
                      onChange={(e) => handleSizeChange(idx, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeSize(idx)}
                    disabled={formData.sizes.length <= 1}
                    className="p-3 text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            <Button type="button" variant="outline" size="sm" onClick={addSize} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Size Option
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-xl text-jet mb-6">Publishing</h2>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-gold"
                />
                <span className="font-sans text-sm text-jet">Active (Visible on store)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 accent-gold"
                />
                <span className="font-sans text-sm text-jet">Featured Product</span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" variant="primary" fullWidth>Save Product</Button>
              <Link to="/admin/products">
                <Button type="button" variant="outline" fullWidth>Cancel</Button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-xl text-jet mb-6">Images</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-[4/5] bg-gray-100 group border border-gray-200">
                  <img src={img} alt="Product upload" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <label className="aspect-[4/5] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors">
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <span className="font-sans text-xs text-gray-500">Upload</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleImageUpload}
                  className="hidden" 
                />
              </label>
            </div>
            <p className="font-sans text-[10px] text-gray-400 leading-relaxed mb-6">
              Recommended: 800x1000px. Warning: Storing large images in localStorage may exceed browser quotas. Max 4MB total.
            </p>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-serif text-sm text-jet mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> AI Generation
              </h3>
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="Describe your product image..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGenerating}
                />
                <Button 
                  type="button" 
                  variant="primary" 
                  fullWidth 
                  size="sm"
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold border-none"
                >
                  {isGenerating ? 'Generating...' : '✨ Generate Image'}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default ProductEdit;
