import { useState, useEffect } from 'react';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/bills.json`).then(r => r.json()).then(setBills);
  }, []);

  const filtered = bills.filter(b =>
    [b.billNumber, b.customerName].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Bills</h2>
        <p className="text-slate-500">View all generated bills.</p>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by bill number or customer..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Bill No</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">GST</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-10 text-center text-gray-500">No bills found.</td></tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBill(b)}>
                    <td className="p-4 font-medium text-slate-800">{b.billNumber}</td>
                    <td className="p-4 text-slate-600">{b.customerName}</td>
                    <td className="p-4 text-slate-600">{b.date}</td>
                    <td className="p-4 text-slate-600">{b.items.length}</td>
                    <td className="p-4 text-slate-600">₹{b.subtotal.toFixed(2)}</td>
                    <td className="p-4 text-slate-600">₹{b.gst.toFixed(2)}</td>
                    <td className="p-4 font-semibold text-emerald-600">₹{b.grandTotal.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedBill(b); }} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">Bill {selectedBill.billNumber}</h3>
              <button onClick={() => setSelectedBill(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Bill Number:</span> <span className="font-medium">{selectedBill.billNumber}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium">{selectedBill.date}</span></div>
                <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{selectedBill.customerName}</span></div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
                  <tr><th className="p-3">Product</th><th className="p-3">Qty</th><th className="p-3">Price</th><th className="p-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedBill.items.map((item, i) => (
                    <tr key={i}>
                      <td className="p-3 text-slate-800">{item.productName}</td>
                      <td className="p-3 text-slate-600">{item.quantity}</td>
                      <td className="p-3 text-slate-600">₹{item.price}</td>
                      <td className="p-3 text-right font-medium">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{selectedBill.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST</span><span>₹{selectedBill.gst.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold text-slate-800"><span>Grand Total</span><span>₹{selectedBill.grandTotal.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => window.print()} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">Print Bill</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
