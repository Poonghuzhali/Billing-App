import { useState, useEffect } from 'react';
import Barcode from '../components/Barcode';
import { loadData, saveData } from '../utils/storage';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData('inventory', 'inventory.json').then(setProducts);
  }, []);

  const filtered = products.filter(p =>
    Object.values(p).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const validateProduct = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Product name is required';
    if (!f.sku.trim()) errs.sku = 'SKU is required';
    if (!f.barcode.trim()) errs.barcode = 'Barcode is required';
    if (!f.invoiceNumber.trim()) errs.invoiceNumber = 'Invoice number is required';
    if (!f.category.trim()) errs.category = 'Category is required';
    if (!f.price || isNaN(f.price) || Number(f.price) <= 0) errs.price = 'Enter a valid price greater than 0';
    if (f.stock === '' || isNaN(f.stock) || Number(f.stock) < 0) errs.stock = 'Enter a valid stock quantity';
    if (!f.mfgDate) errs.mfgDate = 'MFG date is required';
    if (!f.expDate) errs.expDate = 'Expiry date is required';
    if (f.mfgDate && f.expDate && f.expDate <= f.mfgDate) errs.expDate = 'Expiry must be after MFG date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    if (!validateProduct(form)) return;
    if (editIndex !== null) {
      const updated = [...products];
      updated[editIndex] = { ...form, id: products[editIndex].id, price: Number(form.price), stock: Number(form.stock) };
      setProducts(updated);
      saveData('inventory', updated);
    } else {
      const newProduct = { ...form, id: Date.now(), price: Number(form.price), stock: Number(form.stock) };
      const updated = [...products, newProduct];
      setProducts(updated);
      saveData('inventory', updated);
    }
    setShowModal(false);
    setEditIndex(null);
    setErrors({});
    setForm({ name: '', sku: '', barcode: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Inventory</h2>
        <p className="text-slate-500">Manage your product inventory.</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search by name, SKU, invoice..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <button onClick={() => { setEditIndex(null); setErrors({}); setForm({ name: '', sku: '', barcode: '', invoiceNumber: '', gst: '0%', mfgDate: '', expDate: '', price: '', stock: '', category: '', unit: 'Pieces' }); setShowModal(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Barcode</th>
                <th className="p-4">Invoice</th>
                <th className="p-4">GST</th>
                <th className="p-4">MFG Date</th>
                <th className="p-4">Exp Date</th>
                <th className="p-4">Price</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="11" className="p-10 text-center text-gray-500">No products found.</td></tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-slate-800">{p.name}</td>
                    <td className="p-4 text-slate-600">{p.sku}</td>
                    <td className="p-4"><Barcode value={p.barcode} width={1} height={20} /></td>
                    <td className="p-4 text-slate-600">{p.invoiceNumber}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{p.gst}</span></td>
                    <td className="p-4 text-slate-600">{p.mfgDate}</td>
                    <td className="p-4 text-slate-600">{p.expDate}</td>
                    <td className="p-4 text-slate-800 font-semibold">₹{p.price}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">{p.category}</span></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${p.stock < 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(i)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(i)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
              <h3 className="text-lg font-bold text-slate-800">{editIndex !== null ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Product Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Barcode</label>
                  <input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
                  {form.barcode && (
                    <div className="mt-2 p-2 bg-gray-50 rounded flex justify-center">
                      <Barcode value={form.barcode} width={1.5} height={30} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Invoice Number</label>
                  <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">GST</label>
                  <select value={form.gst} onChange={e => setForm({...form, gst: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="0%">0%</option>
                    <option value="5%">5%</option>
                    <option value="12%">12%</option>
                    <option value="18%">18%</option>
                    <option value="28%">28%</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="KG">KG</option>
                    <option value="Litre">Litre</option>
                    <option value="Pack">Pack</option>
                    <option value="Grams">Grams</option>
                    <option value="Pieces">Pieces</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">MFG Date</label>
                  <input type="date" value={form.mfgDate} onChange={e => setForm({...form, mfgDate: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.mfgDate && <p className="text-red-500 text-xs mt-1">{errors.mfgDate}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Exp Date</label>
                  <input type="date" value={form.expDate} onChange={e => setForm({...form, expDate: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  {errors.expDate && <p className="text-red-500 text-xs mt-1">{errors.expDate}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">{editIndex !== null ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
