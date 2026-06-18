import { useState, useEffect } from 'react';
import { loadData, saveData } from '../utils/storage';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    try { const s = localStorage.getItem('billing_shop'); if (s) setShop(JSON.parse(s)); } catch (e) {}
  }, []);

  const backfill = (bills, customers) => {
    let changed = false;
    let s = null;
    try { const x = localStorage.getItem('billing_shop'); if (x) s = JSON.parse(x); } catch (e) {}
    const hasShop = s && (s.name || s.contactPerson || s.phone || s.address);
    const updated = bills.map(b => {
      const b2 = { ...b };
      if ((!b2.shop || !b2.shop.name) && hasShop) { b2.shop = { ...s }; changed = true; }
      if (!b2.customerPhone) {
        const match = customers.find(c => c.name.toLowerCase() === (b2.customerName || '').toLowerCase());
        if (match && match.phone) { b2.customerPhone = match.phone; changed = true; }
      }
      if (!b2.invoiceNumber && b2.billNumber) {
        b2.invoiceNumber = b2.billNumber.replace('BILL', 'INV');
        changed = true;
      }
      return b2;
    });
    if (changed) saveData('bills', updated);
    return updated;
  };

  useEffect(() => {
    Promise.all([
      loadData('bills', 'bills.json'),
      loadData('customers', 'customers.json'),
    ]).then(([bills, customers]) => {
      setInvoices(backfill(bills, customers));
    });
  }, []);

  const filtered = invoices.filter(b =>
    [b.billNumber, b.invoiceNumber, b.customerName, b.customerPhone].some(v => v && String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = invoices.filter(b => b.id !== id);
    setInvoices(updated);
    saveData('bills', updated);
    if (selected?.id === id) setSelected(null);
  };

  const handleDownloadPDF = async (inv) => {
    let s = shop;
    if (!s || !s.name) {
      try { const x = localStorage.getItem('billing_shop'); if (x) s = JSON.parse(x); } catch (e) {}
    }
    const invNum = inv.invoiceNumber || inv.billNumber;

    const itemsHtml = inv.items.map(item => `
      <tr>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${item.productName}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center">${item.quantity}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right">${Number(item.price).toFixed(2)}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right">${Number(item.total).toFixed(2)}</td>
      </tr>
    `).join('');

    const content = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#1e293b;background:#fff;width:720px">
        <div style="border-bottom:2px solid #059669;padding-bottom:12px;margin-bottom:14px">
          <h1 style="font-size:20px;color:#059669;margin:0">${s && s.name ? s.name : 'BillingApp'}</h1>
          ${s && s.contactPerson ? `<p style="font-size:11px;color:#475569;margin:2px 0">Contact: ${s.contactPerson}</p>` : ''}
          ${s && s.phone ? `<p style="font-size:11px;color:#475569;margin:2px 0">Phone: ${s.phone}</p>` : ''}
          ${s && s.address ? `<p style="font-size:11px;color:#475569;margin:2px 0">${s.address}</p>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px">
          <div><div style="font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;margin-bottom:3px">Invoice</div>${invNum}<br><span style="color:#64748b;font-size:11px">${inv.date}</span></div>
          <div style="text-align:right"><div style="font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;margin-bottom:3px">Bill No</div>${inv.billNumber}</div>
        </div>
        <div style="margin-bottom:16px;font-size:12px">
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;margin-bottom:3px">Bill To</div>
          ${inv.customerName}<br>
          ${inv.customerPhone ? `<span style="color:#475569">Phone: ${inv.customerPhone}</span>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:7px 8px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;text-align:left">Product</th>
              <th style="padding:7px 8px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;text-align:center">Qty</th>
              <th style="padding:7px 8px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;text-align:right">Price</th>
              <th style="padding:7px 8px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="width:260px;margin-left:auto">
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span>Subtotal</span><span>${Number(inv.subtotal).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span>GST</span><span>${Number(inv.gst).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0 0;font-size:15px;font-weight:bold;border-top:2px solid #059669;color:#059669"><span>Grand Total</span><span>${Number(inv.grandTotal).toFixed(2)}</span></div>
        </div>
        <div style="text-align:center;font-size:10px;color:#94a3b8;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">Thank you for your business!</div>
      </div>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '750px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0}</style></head><body>' + content + '</body></html>');
    doc.close();

    try {
      await new Promise(r => setTimeout(r, 300));
      const body = iframe.contentDocument.body;
      body.style.display = 'inline-block';
      const canvas = await html2canvas(body, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = (canvas.height * pw) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
      let rest = ph - pdf.internal.pageSize.getHeight();
      while (rest > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, rest - ph, pw, ph);
        rest -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`Invoice-${invNum}.pdf`);
    } catch (err) {
      alert('PDF Error: ' + err.message);
    } finally {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">Invoices</h2>
        <p className="text-slate-500">View all generated invoices.</p>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by bill no, invoice no or customer..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-slate-700 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-2">Bill No</th>
                <th className="p-2">Invoice No</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Date</th>
                <th className="p-2">Items</th>
                <th className="p-2">Total</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-6 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(b)}>
                    <td className="p-2 text-slate-600 text-xs">{b.billNumber}</td>
                    <td className="p-2 font-medium text-slate-800 text-xs">{b.invoiceNumber || b.billNumber}</td>
                    <td className="p-2 text-slate-600 text-xs">{b.customerName}</td>
                    <td className="p-2 text-slate-600 text-xs">{b.customerPhone || '-'}</td>
                    <td className="p-2 text-slate-600 text-xs">{b.date}</td>
                    <td className="p-2 text-slate-600 text-xs">{b.items.length}</td>
                    <td className="p-2 font-semibold text-emerald-600 text-xs">₹{b.grandTotal.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setSelected(b); }} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition">View</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(b); }} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          PDF
                        </button>
                        <button onClick={(e) => handleDelete(b.id, e)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-800">Invoice {selected.invoiceNumber || selected.billNumber}</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {shop && shop.name && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs space-y-0.5">
                  <p className="font-bold text-emerald-800">{shop.name}</p>
                  {shop.contactPerson && <p className="text-emerald-700">Contact: {shop.contactPerson}</p>}
                  {shop.phone && <p className="text-emerald-700">Phone: {shop.phone}</p>}
                  {shop.address && <p className="text-emerald-700">{shop.address}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Bill No:</span> <span className="font-medium ml-1">{selected.billNumber}</span></div>
                <div><span className="text-slate-500">Invoice No:</span> <span className="font-medium ml-1">{selected.invoiceNumber || selected.billNumber}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium ml-1">{selected.date}</span></div>
                <div><span className="text-slate-500">Customer:</span> <span className="font-medium ml-1">{selected.customerName}</span></div>
                {selected.customerPhone && <div className="col-span-2"><span className="text-slate-500">Phone:</span> <span className="font-medium ml-1">{selected.customerPhone}</span></div>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-widest">
                    <tr><th className="p-2">Product</th><th className="p-2">Qty</th><th className="p-2">Price</th><th className="p-2 text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 text-slate-800 text-xs">{item.productName}</td>
                        <td className="p-2 text-slate-600 text-xs">{item.quantity}</td>
                        <td className="p-2 text-slate-600 text-xs">₹{item.price}</td>
                        <td className="p-2 text-right font-medium text-xs">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t pt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{selected.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST</span><span>₹{selected.gst.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold text-slate-800"><span>Grand Total</span><span>₹{selected.grandTotal.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => handleDownloadPDF(selected)} className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
