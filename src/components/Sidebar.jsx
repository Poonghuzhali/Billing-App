import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/billing', label: 'Billing', icon: '🧾' },
  { to: '/bills', label: 'Bills', icon: '📄' },
  { to: '/customer', label: 'Customer', icon: '👤' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/seller', label: 'Seller', icon: '🏪' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-64 bg-slate-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-50 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 text-xl font-bold border-b border-slate-700">
          <span>Billing<span className="text-emerald-400">App</span></span>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-xs text-slate-500 border-t border-slate-700">
          &copy; 2026 BillingApp
        </div>
      </aside>
    </>
  );
}
