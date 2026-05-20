import { useState, useEffect, useRef, useCallback } from 'react';
import CameraScanner from '../components/CameraScanner';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [lastScan, setLastScan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const scanInputRef = useRef(null);
  const scanBuffer = useRef('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/inventory.json`).then(r => r.json()).then(setProducts);
    fetch(`${import.meta.env.BASE_URL}data/customers.json`).then(r => r.json()).then(setCustomers);
    fetch(`${import.meta.env.BASE_URL}data/bills.json`).then(r => r.json()).then(setBills);
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  useEffect(() => {
    let timer = null;
    const handleKey = (e) => {
      if (e.key === 'Enter') {
        const code = scanBuffer.current.trim();
        if (code.length > 3) {
          const found = products.find(p => p.barcode === code);
          if (found) {
            addToCart(found);
            setLastScan(found.name);
            setTimeout(() => setLastScan(null), 2000);
          }
        }
        scanBuffer.current = '';
        return;
      }
      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { scanBuffer.current = ''; }, 200);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [products, addToCart]);

  const filtered = products.filter(p =>
    [p.name, p.sku, p.barcode].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const handleManualBarcode = () => {
    const found = products.find(p => p.barcode === scannedBarcode);
    if (found) {
      addToCart(found);
      setLastScan(found.name);
      setTimeout(() => setLastScan(null), 2000);
    } else {
      alert('Product not found with this barcode.');
    }
    setScannedBarcode('');
  };

  const handleCameraScan = useCallback((barcode) => {
    const found = products.find(p => p.barcode === barcode);
    if (found) {
      addToCart(found);
      setLastScan(found.name);
      setTimeout(() => setLastScan(null), 2000);
    }
  }, [products, addToCart]);

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = cart.reduce((sum, item) => {
    const gstPct = parseInt(item.gst) || 0;
    return sum + (item.price * item.quantity * gstPct) / 100;
  }, 0);
  const grandTotal = subtotal + gstAmount;

  const generateBillNumber = () => {
    const count = bills.length + 1;
    const now = new Date();
    return `BILL-${now.getFullYear()}-${String(count).padStart(3, '0')}`;
  };

  const handleGenerateBill = () => {
    if (!customerName || cart.length === 0) return;
    const newBill = {
      id: Date.now(),
      billNumber: generateBillNumber(),
      customerName,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal,
      gst: gstAmount,
      grandTotal
    };
    setBills(prev => [...prev, newBill]);
    setCart([]);
    setCustomerName('');
    setShowPaymentModal(false);
    alert(`Bill ${newBill.billNumber} generated successfully!`);
  };

  const paymentMethods = ['Cash', 'UPI', 'Card', 'Credit'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Billing</h2>
        <p className="text-slate-500">Scan products and generate bills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Scan Barcode</h3>
            {lastScan && (
              <div className="mb-3 px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-semibold animate-pulse">
                ✓ {lastScan} added to cart
              </div>
            )}
            <div className="flex flex-wrap gap-3 mb-3">
              <CameraScanner onScan={handleCameraScan} />
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scannedBarcode}
                  onChange={e => setScannedBarcode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualBarcode()}
                  placeholder="Type barcode and press Enter..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button onClick={handleManualBarcode} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition whitespace-nowrap">Add</button>
            </div>
            <p className="text-xs text-slate-400">Point your camera at a barcode to scan automatically, or type it in manually.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Search Products</h3>
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, or barcode..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-slate-500 text-sm col-span-2 text-center py-4">No products found.</p>
              ) : (
                filtered.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">₹{p.price} | {p.sku}</p>
                    </div>
                    <button onClick={() => addToCart(p)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Add</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Customer</h3>
            <select value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-gray-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Current Bill</h3>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No items added.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold">−</button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST</span>
                <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-800">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && setShowPaymentModal(true)} disabled={cart.length === 0} className="w-full mt-4 bg-emerald-600 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Generate Bill</button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Customer</span><span className="font-medium">{customerName || 'Walk-in Customer'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Items</span><span className="font-medium">{cart.reduce((s, i) => s + i.quantity, 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">GST</span><span className="font-medium">₹{gstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-3"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Payment Method</h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map(m => (
                <button key={m} className="p-3 border border-gray-200 rounded-lg text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 transition">💳 {m}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-5 py-2.5 text-sm font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleGenerateBill} className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">Pay & Generate Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
