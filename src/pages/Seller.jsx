import { useState, useEffect } from 'react';
import { loadData, saveData } from '../utils/storage';

const FIELD_HINTS = {
  name: 'e.g. ABC Traders',
  contactPerson: 'e.g. John Doe',
  phone: 'Enter 10-digit phone number',
  email: 'e.g. contact@abctraders.com',
  category: 'e.g. Electronics',
  address: 'Enter full address with city',
};

export default function Seller() {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '', status: 'Active' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData('sellers', 'sellers.json').then(setSellers);
  }, []);

  const filtered = sellers.filter(s =>
    [s.name, s.contactPerson, s.phone, s.email].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const validateField = (name, value, formData) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Seller name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'contactPerson':
        if (!value.trim()) return 'Contact person is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone is required';
        if (!/^\d{10}$/.test(value.trim())) return 'Enter exactly 10 digits only (e.g. 9876543210)';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address (e.g. name@domain.com)';
        return '';
      case 'category':
        if (!value.trim()) return 'Category is required';
        return '';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Enter a complete address';
        return '';
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

  const validateSeller = () => {
    const errs = {};
    for (const key of Object.keys(FIELD_HINTS)) {
      const err = validateField(key, form[key], form);
      if (err) errs[key] = err;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEdit = (s) => {
    setForm(s);
    setEditId(s.id);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const updated = sellers.filter(s => s.id !== id);
    setSellers(updated);
    saveData('sellers', updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateSeller()) return;
    let updated;
    if (editId) {
      updated = sellers.map(s => s.id === editId ? { ...form, id: editId } : s);
    } else {
      updated = [...sellers, { ...form, id: Date.now() }];
    }
    setSellers(updated);
    saveData('sellers', updated);
    setShowModal(false);
    setEditId(null);
    setErrors({});
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '', status: 'Active' });
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">Sellers</h2>
        <p className="text-slate-500">Manage your product suppliers and sellers.</p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, contact, phone or email..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-slate-700 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <button onClick={() => { setEditId(null); setErrors({}); setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '', status: 'Active' }); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Seller
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-2">Seller</th>
                <th className="p-2">Contact Person</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Email</th>
                <th className="p-2">Category</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No sellers found.</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-2 font-medium text-slate-800">{s.name}</td>
                    <td className="p-2 text-slate-600">{s.contactPerson}</td>
                    <td className="p-2 text-slate-600">{s.phone}</td>
                    <td className="p-2 text-slate-600">{s.email}</td>
                    <td className="p-2"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">{s.category}</span></td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-800">{editId ? 'Edit Seller' : 'Add Seller'}</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seller Name</label>
                  <input value={form.name} onChange={e => handleFieldChange('name', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Contact Person</label>
                  <input value={form.contactPerson} onChange={e => handleFieldChange('contactPerson', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.contactPerson ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.contactPerson && <p className="text-red-500 text-[10px] mt-0.5">{errors.contactPerson}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.contactPerson}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={e => handleFieldChange('phone', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.phone && <p className="text-red-500 text-[10px] mt-0.5">{errors.phone}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" value={form.email} onChange={e => handleFieldChange('email', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <input value={form.category} onChange={e => handleFieldChange('category', e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.category ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.category && <p className="text-red-500 text-[10px] mt-0.5">{errors.category}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.category}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Address</label>
                  <textarea value={form.address} onChange={e => handleFieldChange('address', e.target.value)} rows={2} className={`w-full border text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.address ? 'border-red-400' : 'border-gray-200'} text-slate-700`} />
                  {errors.address && <p className="text-red-500 text-[10px] mt-0.5">{errors.address}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{FIELD_HINTS.address}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }} className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">{editId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
