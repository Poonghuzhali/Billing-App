import { useState, useEffect } from 'react';
import { loadData, saveData } from '../utils/storage';

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData('customers', 'customers.json').then(setCustomers);
  }, []);

  const filtered = customers.filter(c =>
    [c.name, c.phone, c.email].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const validateCustomer = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required';
    if (!f.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(f.phone)) errs.phone = 'Enter exactly 10 digits only';
    if (!f.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Enter a valid email address';
    if (!f.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEdit = (c) => {
    setForm(c);
    setEditId(c.id);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveData('customers', updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateCustomer(form)) return;
    let updated;
    if (editId) {
      updated = customers.map(c => c.id === editId ? { ...form, id: editId } : c);
    } else {
      updated = [...customers, { ...form, id: Date.now() }];
    }
    setCustomers(updated);
    saveData('customers', updated);
    setShowModal(false);
    setEditId(null);
    setErrors({});
    setForm({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <p className="text-slate-500">Manage your customer records.</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <button onClick={() => { setEditId(null); setErrors({}); setForm({ name: '', phone: '', email: '', address: '' }); setShowModal(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Email</th>
                <th className="p-4">Address</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500">No customers found.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-slate-800">{c.name}</td>
                    <td className="p-4 text-slate-600">{c.phone}</td>
                    <td className="p-4 text-slate-600">{c.email}</td>
                    <td className="p-4 text-slate-600 truncate max-w-[160px] sm:max-w-xs">{c.address}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(c)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
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
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">{editId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
