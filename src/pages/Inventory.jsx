import { useState, useEffect, useMemo } from 'react';
import Barcode from '../components/Barcode';
import { loadData, saveData } from '../utils/storage';
import { addToCart as addToCartUtil } from '../utils/cart';

const FIELD_HINTS = {
  name: 'e.g. Organic Honey',
  sku: 'Format: XXX-999 (e.g. SKU-001)',
  invoiceNumber: 'e.g. INV-2024-001',
  price: 'e.g. 299.00',
  stock: 'e.g. 100',
  mfgDate: 'Select manufacturing date',
  expDate: 'Select expiry date',
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' });
  const [errors, setErrors] = useState({});
  const [cartMsg, setCartMsg] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    loadData('inventory', 'inventory.json').then(setProducts);
    loadData('categories', 'categories.json').then(data => {
      if (data && data.length) setCategories(data);
    });
  }, []);

  const allCategories = useMemo(() => {
    const unique = new Set();
    categories.forEach(c => c && unique.add(c));
    products.forEach(p => p.category && unique.add(p.category));
    return [...unique].sort();
  }, [categories, products]);

  const filtered = products.filter(p =>
    Object.values(p).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const validateField = (name, value, formData) => {
    const f = { ...formData, [name]: value };
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Product name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'sku': {
        if (!value.trim()) return 'SKU is required';
        if (!/^[A-Za-z]{3}-\d{3}$/.test(value.trim())) return 'Must match format XXX-999 (e.g. SKU-001)';
        if (editIndex === null && products.some(p => p.sku === value.trim())) return 'SKU already exists';
        return '';
      }
      case 'invoiceNumber':
        if (!value.trim()) return 'Invoice number is required';
        return '';
      case 'category':
        if (!value.trim()) return 'Category is required';
        return '';
      case 'price':
        if (value === '' || isNaN(value) || Number(value) <= 0) return 'Enter a valid price greater than 0';
        return '';
      case 'stock':
        if (value === '' || isNaN(value) || Number(value) < 0) return 'Enter a valid stock quantity (0 or more)';
        return '';
      case 'mfgDate':
        if (!value) return 'MFG date is required';
        if (value > new Date().toISOString().split('T')[0]) return 'MFG date cannot be in the future';
        return '';
      case 'expDate': {
        if (!value) return 'Expiry date is required';
        const mfg = f.mfgDate || formData.mfgDate || form.mfgDate;
        if (mfg && value <= mfg) return 'Expiry must be after MFG date';
        return '';
      }
      default:
        return '';
    }
  };

  const handleFieldChange = (name, value) => {
    const updated = { ...form, [name]: value };
    setForm(updated);
    const err = validateField(name, value, updated);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const validateProduct = () => {
    const errs = {};
    for (const key of Object.keys(FIELD_HINTS)) {
      const err = validateField(key, form[key], form);
      if (err) errs[key] = err;
    }
    if (!form.category.trim()) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddToCart = (product) => {
    const result = addToCartUtil(product);
    if (result.success) {
      setCartMsg(`${product.name} added`);
    } else {
      setCartMsg(`"${product.name}" is out of stock!`);
    }
    setTimeout(() => setCartMsg(''), 2000);
  };

  const handleEdit = (index) => {
    setForm(products[index]);
    setEditIndex(index);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
    saveData('inventory', updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateProduct()) return;
    if (editIndex !== null) {
      const updated = [...products];
      updated[editIndex] = { ...form, id: products[editIndex].id, price: Number(form.price), stock: Number(form.stock) };
      setProducts(updated);
      saveData('inventory', updated);
    } else {
      const barcode = `2${Date.now()}`;
      const newProduct = { ...form, barcode, id: Date.now(), price: Number(form.price), stock: Number(form.stock) };
      const updated = [...products, newProduct];
      setProducts(updated);
      saveData('inventory', updated);
    }
    setShowModal(false);
    setEditIndex(null);
    setErrors({});
    setForm({ name: '', sku: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' });
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) return;
    const updated = [...categories, name];
    setCategories(updated);
    saveData('categories', updated);
    setForm({ ...form, category: name });
    setNewCatName('');
    setShowAddCat(false);
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Inventory</h2>
        <p className="text-slate-500">Manage your product inventory.</p>
        {cartMsg && <p className="mt-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold inline-block">{cartMsg}</p>}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search by name, SKU, invoice..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-slate-700 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <button onClick={() => { setEditIndex(null); setErrors({}); setForm({ name: '', sku: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' }); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-2 py-1.5">Product</th>
                <th className="px-2 py-1.5">SKU</th>
                <th className="px-2 py-1.5">Barcode</th>
                <th className="px-2 py-1.5">Invoice</th>
                <th className="px-2 py-1.5">GST</th>
                <th className="px-2 py-1.5">MFG Date</th>
                <th className="px-2 py-1.5">Exp Date</th>
                <th className="px-2 py-1.5">Price</th>
                <th className="px-2 py-1.5">Category</th>
                <th className="px-2 py-1.5">Stock</th>
                <th className="px-3 py-1.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="11" className="p-6 text-center text-xs text-gray-500">No products found.</td></tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-xs font-medium text-slate-800">{p.name}</td>
                    <td className="px-2 py-1.5 text-xs text-slate-600">{p.sku}</td>
                    <td className="px-2 py-1.5"><Barcode value={p.barcode} downloadable /></td>
                    <td className="px-2 py-1.5 text-xs text-slate-600">{p.invoiceNumber}</td>
                    <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">{p.gst}</span></td>
                    <td className="px-2 py-1.5 text-xs text-slate-600">{p.mfgDate}</td>
                    <td className="px-2 py-1.5 text-xs text-slate-600">{p.expDate}</td>
                    <td className="px-2 py-1.5 text-xs text-slate-800 font-semibold">₹{p.price}</td>
                    <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold">{p.category}</span></td>
                    <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.stock < 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleAddToCart(p)} className="p-1 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition text-xs" title="Add to billing cart">+</button>
                        <button onClick={() => handleEdit(i)} className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(i)} className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-800">{editIndex !== null ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Product Name</label>
                  <input value={form.name} onChange={e => handleFieldChange('name', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">SKU</label>
                  <input value={form.sku} onChange={e => handleFieldChange('sku', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.sku ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.sku && <p className="text-red-500 text-[10px] mt-0.5">{errors.sku}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.sku}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Barcode</label>
                  {editIndex !== null ? (
                    <>
                      <p className="text-xs text-slate-600 mb-2">{products[editIndex]?.barcode}</p>
                      {products[editIndex]?.barcode && (
                        <div className="p-2 bg-gray-50 rounded flex justify-center">
                          <Barcode value={products[editIndex].barcode} downloadable />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Auto-generated on save</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Invoice Number</label>
                  <input value={form.invoiceNumber} onChange={e => handleFieldChange('invoiceNumber', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.invoiceNumber ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.invoiceNumber && <p className="text-red-500 text-[10px] mt-0.5">{errors.invoiceNumber}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">GST</label>
                  <select value={form.gst} onChange={e => setForm({...form, gst: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="0%">0%</option>
                    <option value="5%">5%</option>
                    <option value="12%">12%</option>
                    <option value="18%">18%</option>
                    <option value="28%">28%</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <div className="flex gap-2">
                    <select value={form.category} onChange={e => {
                      const val = e.target.value;
                      if (val === '__add__') { setShowAddCat(true); return; }
                      handleFieldChange('category', val);
                    }} className={`flex-1 border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.category ? 'border-red-400' : 'border-gray-200'} text-slate-700`}>
                      <option value="">Select category</option>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__add__">+ Add New Category</option>
                    </select>
                  </div>
                  {errors.category && <p className="text-red-500 text-[10px] mt-0.5">{errors.category}</p>}
                  {showAddCat && (
                    <div className="mt-2 flex gap-2">
                      <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name..." className="flex-1 border border-gray-200 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700" />
                      <button type="button" onClick={handleAddCategory} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Add</button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCatName(''); }} className="text-slate-500 text-xs px-2 py-1.5 hover:text-slate-700 transition">Cancel</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="KG">KG</option>
                    <option value="Litre">Litre</option>
                    <option value="Pack">Pack</option>
                    <option value="Grams">Grams</option>
                    <option value="Pieces">Pieces</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => handleFieldChange('price', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.price ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.price && <p className="text-red-500 text-[10px] mt-0.5">{errors.price}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.price}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stock</label>
                  <input type="number" value={form.stock} onChange={e => handleFieldChange('stock', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.stock ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.stock && <p className="text-red-500 text-[10px] mt-0.5">{errors.stock}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.stock}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">MFG Date</label>
                  <input type="date" value={form.mfgDate} onChange={e => handleFieldChange('mfgDate', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.mfgDate ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.mfgDate && <p className="text-red-500 text-[10px] mt-0.5">{errors.mfgDate}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.mfgDate}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Exp Date</label>
                  <input type="date" value={form.expDate} onChange={e => handleFieldChange('expDate', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.expDate ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.expDate && <p className="text-red-500 text-[10px] mt-0.5">{errors.expDate}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.expDate}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }} className="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">{editIndex !== null ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
