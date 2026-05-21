import { useState, useEffect } from 'react';
import { saveData } from '../utils/storage';

const DEFAULT_SHOP = { name: '', contactPerson: '', phone: '', address: '' };

export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SHOP);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('billing_shop');
    if (stored) {
      try { setForm(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    saveData('shop', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-3 md:p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">Shop Settings</h2>
        <p className="text-slate-500">Manage your shop details used in invoices.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Shop Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ABC General Store" className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Contact Person</label>
            <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} placeholder="e.g. John Doe" className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Contact Number</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 9876543210" className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Shop Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} placeholder="e.g. 123, Main Road, City - 600001" className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="bg-emerald-600 text-white px-5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Save Shop Details</button>
            {saved && <span className="text-emerald-600 text-xs font-semibold">Saved successfully!</span>}
          </div>
        </form>
      </div>

      {form.name && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preview</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
            <p className="font-bold text-slate-800">{form.name}</p>
            {form.contactPerson && <p className="text-slate-600">Contact: {form.contactPerson}</p>}
            {form.phone && <p className="text-slate-600">Phone: {form.phone}</p>}
            {form.address && <p className="text-slate-600">{form.address}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
