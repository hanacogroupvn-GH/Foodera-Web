
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Product, CategoryType } from '../../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Save,
  Loader2,
  Trash,
  PlusCircle,
  Hash,
  Tag,
  LogOut
} from 'lucide-react';

const AdminInventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    category: 'Rice',
    subCategory: '',
    description: '',
    shortDescription: '',
    image: '',
    gallery: [],
    specifications: {},
    filters: {}
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        gallery: product.gallery || [],
        specifications: { ...product.specifications }
      });
    } else {
      setEditingProduct(null);
      setFormData({
        id: `FM-${Math.floor(Math.random() * 10000)}`,
        name: '',
        category: 'Rice',
        subCategory: '',
        description: '',
        shortDescription: '',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200',
        gallery: [],
        specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max' },
        filters: { type: 'Standard' }
      });
    }
    setNewGalleryUrl('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setFormData({
      ...formData,
      gallery: [...(formData.gallery || []), newGalleryUrl.trim()]
    });
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updatedGallery = [...(formData.gallery || [])];
    updatedGallery.splice(index, 1);
    setFormData({ ...formData, gallery: updatedGallery });
  };

  // Specification Management
  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [`Attribute ${Object.keys(formData.specifications || {}).length + 1}`]: 'Value'
      }
    });
  };

  const handleUpdateSpec = (oldKey: string, newKey: string, value: string) => {
    const newSpecs = { ...formData.specifications };
    if (oldKey !== newKey) {
      delete newSpecs[oldKey];
    }
    newSpecs[newKey] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.id) {
      alert("Product ID is required.");
      setIsSaving(false);
      return;
    }

    // Check for ID collision
    const collision = products.find(p => p.id === formData.id);
    if (collision && (!editingProduct || editingProduct.id !== formData.id)) {
      alert(`The ID "${formData.id}" is already assigned to "${collision.name}". Please use a unique identifier.`);
      setIsSaving(false);
      return;
    }

    // Simulate API delay
    setTimeout(() => {
      if (editingProduct) {
        // Pass original ID to handle primary key changes
        updateProduct(formData as Product, editingProduct.id);
      } else {
        addProduct(formData as Product);
      }
      setIsSaving(false);
      closeModal();
    }, 600);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the global catalog?`)) {
      deleteProduct(id);
    }
  };

  const handleExit = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Mini Sidebar */}
      <aside className="w-22 bg-foodmax-forest text-white flex flex-col items-center py-8 gap-8 sticky top-0 h-screen shadow-2xl z-20">
        <Link to="/admin" className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5"><ChevronLeft size={24} /></Link>
        <div className="flex flex-col gap-6 flex-grow">
          <Link to="/admin/inventory" className="p-3.5 bg-foodmax-lime text-foodmax-forest rounded-2xl shadow-xl shadow-foodmax-lime/20 border border-foodmax-lime/20"><Package size={24} /></Link>
        </div>

        {/* Mini Branded Exit Button */}
        <div className="mt-auto pt-6 border-t border-white/10 w-full flex flex-col items-center gap-4">
          <button 
            onClick={handleExit}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all group relative overflow-visible"
            title="Exit to Homepage"
          >
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
               <div className="flex items-center relative">
                  <span className="text-foodmax-forest font-[900] text-xl">F</span>
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-foodmax-lime rounded-full flex items-center justify-center border-2 border-foodmax-forest shadow-md">
              <LogOut size={10} className="text-foodmax-forest" />
            </div>
            
            {/* Tooltip Label */}
            <div className="absolute left-full ml-4 py-2 px-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
              Exit to Home
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-grow p-8 md:p-12 overflow-y-auto">
        {/* ... (Existing main content remains identical) */}
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Inventory</h1>
              <p className="text-gray-500 font-medium">Manage product specifications and stock availability for B2B export.</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="px-8 py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"
            >
              <Plus size={20} /> Add New Commodity
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder="Search by variety name, grade, category, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodmax-forest/10 border-none text-sm font-medium"
              />
            </div>
            <button className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all">
              <Filter size={16} /> Filter Segment
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Product Intelligence</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner">
                          <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-900 leading-tight">{p.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {p.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-foodmax-forest/5 text-foodmax-forest text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {p.category}
                      </span>
                      <p className="text-xs text-gray-400 font-bold mt-1">{p.subCategory}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Active Export</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openModal(p)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodmax-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No matching commodities found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal remains identical */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-foodmax-forest text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingProduct ? 'Edit Commodity' : 'Register New Commodity'}
                </h2>
                <p className="text-foodmax-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">Export Intelligence Update</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-10 space-y-10">
              {/* Product SKU / ID - NOW MANUALLY EDITABLE */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-foodmax-forest text-white rounded-lg"><Tag size={18} /></div>
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Unique Identifier (SKU / ID)</h3>
                </div>
                <input 
                  type="text" 
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full px-4 py-4 bg-white border-2 border-transparent focus:border-foodmax-forest/20 rounded-xl outline-none text-sm font-black transition-all"
                  placeholder="e.g. RICE-JASMINE-001"
                  required
                />
                <p className="text-[10px] text-gray-400 italic">
                  {editingProduct 
                    ? "Warning: Changing the ID will update the primary key for this record across the system."
                    : "This ID is used for system mapping and can be manually adjusted later."}
                </p>
              </div>

              {/* Main Image Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Primary Hero Visual (URL)</label>
                <div className="flex gap-6 items-start">
                  <div className="w-40 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-200" size={32} />
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <input 
                      type="url" 
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      required
                    />
                    <p className="text-[10px] text-gray-400 italic">This is the main image displayed in the catalog.</p>
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div>
                  <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-2">Product Detail Gallery</label>
                  <p className="text-[11px] text-gray-500 mb-6">Add close-up shots of grains, beans, or export packaging.</p>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {formData.gallery?.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-white border border-gray-100 shadow-sm">
                      <img src={url} className="w-full h-full object-cover" alt={`detail-${idx}`} />
                      <button 
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  {(!formData.gallery || formData.gallery.length < 3) && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest mt-2">Empty Slot</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Add detail image URL..."
                    className="flex-grow px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-xs font-medium"
                  />
                  <button 
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="px-4 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-colors"
                  >
                    Add Photo
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Variety Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Global Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as CategoryType})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold cursor-pointer"
                  >
                    <option value="Rice">Rice</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Agriculture">Agriculture</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sub-Category</label>
                <input 
                  type="text" 
                  value={formData.subCategory}
                  onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                  placeholder="e.g. Premium & Fragrant Rice"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Short Commercial Description</label>
                <input 
                  type="text" 
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                  placeholder="Brief hook for catalog browsing..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Technical Portfolio Description</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder="Comprehensive variety details and processing standards..."
                  required
                />
              </div>

              {/* DYNAMIC QUALITY SPECS EDITOR */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodmax-forest" /> Quality Matrix / Specifications
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Technical laboratory values</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> Add Attribute
                  </button>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(formData.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input 
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateSpec(key, e.target.value, value as string)}
                          placeholder="Label (e.g. Moisture)"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input 
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateSpec(key, key, e.target.value)}
                          placeholder="Value (e.g. 14.0% Max)"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.specifications || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No quality specs defined</p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
              <button 
                onClick={closeModal}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <><Save size={18} /> {editingProduct ? 'Commit Portfolio Update' : 'Initialize Commodity Entry'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
