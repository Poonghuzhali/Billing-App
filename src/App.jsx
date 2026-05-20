import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Bills from './pages/Bills';
import Customer from './pages/Customer';
import Seller from './pages/Seller';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/customers" element={<Customer />} />
          <Route path="/sellers" element={<Seller />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
