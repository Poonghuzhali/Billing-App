import { useState, useEffect, useRef, useCallback } from 'react';
import CameraScanner from '../components/CameraScanner';
import { loadData, saveData } from '../utils/storage';
import { getCart, saveCart, clearCart } from '../utils/cart';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shop, setShop] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [customerErrors, setCustomerErrors] = useState({});
  const [billError, setBillError] = useState('');
  const scanInputRef = useRef(null);
  const scanBuffer = useRef('');

  useEffect(() => {
    loadData('inventory', 'inventory.json').then(setProducts);
    loadData('customers', 'customers.json').then(setCustomers);
    loadData('bills', 'bills.json').then(setBills);
    setCart(getCart());
    const storedShop = localStorage.getItem('billing_shop');
    if (storedShop) {
      try { setShop(JSON.parse(storedShop)); } catch (e) {}
    }
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(item => item.id === product.id);
      if (idx >= 0) {
        updated[idx].quantity += 1;
      } else {
        updated.push({ ...product, quantity: 1 });
      }
      saveCart(updated);
      return updated;
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
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    saveCart(updated);
  };

  const updateQty = (id, delta) => {
    const updated = cart.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setCart(updated);
    saveCart(updated);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = cart.reduce((sum, item) => {
    const gstPct = parseInt(item.gst) || 0;
    return sum + (item.price * item.quantity * gstPct) / 100;
  }, 0);
  const grandTotal = subtotal + gstAmount;

  const nextSequence = () => {
    const now = new Date();
    const y = now.getFullYear();
    const existing = bills
      .filter(b => b.billNumber && b.billNumber.startsWith(`BILL-${y}-`))
      .map(b => parseInt(b.billNumber.replace(`BILL-${y}-`, ''), 10))
      .filter(n => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return { year: y, seq: next };
  };

  const generateBillNumber = () => {
    const { year, seq } = nextSequence();
    return `BILL-${year}-${String(seq).padStart(4, '0')}`;
  };

  const generateInvoiceNumber = () => {
    const { year, seq } = nextSequence();
    return `INV-${year}-${String(seq).padStart(4, '0')}`;
  };

  const handleGenerateBill = () => {
    if (!customerName) { setBillError('Please select a customer'); return; }
    if (cart.length === 0) { setBillError('Add at least one item to the cart'); return; }
    setBillError('');
    const newBill = {
      id: Date.now(),
      billNumber: generateBillNumber(),
      invoiceNumber: generateInvoiceNumber(),
      customerName,
      customerPhone,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal,
      gst: gstAmount,
      grandTotal,
      shop: shop ? { ...shop } : null
    };
    const updated = [...bills, newBill];
    setBills(updated);
    saveData('bills', updated);
    setCart([]);
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerSearch('');
    setShowPaymentModal(false);
    alert(`Invoice ${newBill.invoiceNumber} generated successfully!`);
  };

  const paymentMethods = ['Cash', 'UPI', 'Card', 'Credit'];

  const customerFiltered = customers.filter(c =>
    [c.name, c.phone].some(v => v.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const validateNewCustomer = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required';
    if (!f.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(f.phone)) errs.phone = 'Enter exactly 10 digits only';
    if (!f.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Enter a valid email';
    setCustomerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddCustomer = () => {
    if (!validateNewCustomer(newCustomer)) return;
    const added = { ...newCustomer, id: Date.now() };
    const updated = [...customers, added];
    setCustomers(updated);
    saveData('customers', updated);
    setCustomerName(added.name);
    setCustomerSearch(added.name);
    setShowAddCustomerModal(false);
    setCustomerErrors({});
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">Billing</h2>
        <p className="text-slate-500">Scan products and generate bills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Scan Barcode</h3>
            {lastScan && (
              <div className="mb-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold animate-pulse">
                ✓ {lastScan} added
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
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-slate-700 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button onClick={handleManualBarcode} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition whitespace-nowrap">Add</button>
            </div>
            <p className="text-[10px] text-slate-400">Point your camera at a barcode to scan automatically, or type it in manually.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Added for Billing</h3>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No items added. Add products from Inventory or scan barcode.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-[10px] font-bold">−</button>
                      <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-[10px] font-bold">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</h3>
              <button onClick={() => setShowAddCustomerModal(true)} className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add Customer
              </button>
            </div>
            <div className="relative" onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}>
              <input
                type="text"
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search by name or phone..."
                className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {customerFiltered.length === 0 ? (
                    <p className="p-2 text-xs text-slate-400">No customers found.</p>
                  ) : (
                    customerFiltered.map(c => (
                      <button
                        key={c.id}
                        onMouseDown={() => { setCustomerName(c.name); setCustomerPhone(c.phone || ''); setCustomerSearch(c.name); setShowCustomerDropdown(false); }}
                        className="w-full text-left p-2 hover:bg-gray-50 text-xs border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="text-slate-500 ml-2">{c.phone}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Bill</h3>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-3">No items added.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">₹{item.price} × {item.quantity}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">GST</span>
                <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            {billError && <p className="text-red-500 text-[10px] mt-1 text-center">{billError}</p>}
            <button onClick={() => { setBillError(''); if (cart.length > 0 && customerName) setShowPaymentModal(true); else if (!customerName) setBillError('Please select a customer'); else setBillError('Add at least one item to the cart'); }} className="w-full mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Generate Bill</button>
          </div>
        </div>
      </div>

      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Add Customer</h3>
              <button onClick={() => { setShowAddCustomerModal(false); setCustomerErrors({}); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Name</label>
                <input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {customerErrors.name && <p className="text-red-500 text-xs mt-0.5">{customerErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                <input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {customerErrors.phone && <p className="text-red-500 text-xs mt-0.5">{customerErrors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                <input value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full border border-gray-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                {customerErrors.email && <p className="text-red-500 text-xs mt-0.5">{customerErrors.email}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button onClick={() => { setShowAddCustomerModal(false); setCustomerErrors({}); }} className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button onClick={handleAddCustomer} className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4">
            <h3 className="text-base font-bold text-slate-800 mb-4">Payment Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Customer</span><span className="font-medium">{customerName || 'Walk-in Customer'}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Items</span><span className="font-medium">{cart.reduce((s, i) => s + i.quantity, 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">GST</span><span className="font-medium">₹{gstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t pt-2"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Payment Method</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {paymentMethods.map(m => (
                <button key={m} className="p-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:border-emerald-300 transition">💳 {m}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-1.5 text-xs font-semibold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleGenerateBill} className="flex-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">Pay & Generate Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
