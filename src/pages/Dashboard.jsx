import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { loadData } from '../utils/storage';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    Promise.all([
      loadData('inventory', 'inventory.json'),
      loadData('bills', 'bills.json'),
    ]).then(([inv, bls]) => {
      setInventory(inv);
      setBills(bls);
    });
  }, []);

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((s, p) => s + p.stock, 0);
  const totalBills = bills.length;
  const totalRevenue = bills.reduce((s, b) => s + b.grandTotal, 0);

  const categoryStock = inventory.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.stock;
    return acc;
  }, {});

  const productSales = bills.flatMap(b => b.items).reduce((acc, item) => {
    acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
    return acc;
  }, {});

  const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
  const topProducts = sortedProducts.slice(0, 8);
  const otherSales = sortedProducts.slice(8).reduce((s, [, qty]) => s + qty, 0);

  const barLabels = [...topProducts.map(([name]) => name), ...(topProducts.length < sortedProducts.length ? ['Others'] : [])];
  const barDataValues = [...topProducts.map(([, qty]) => qty), ...(topProducts.length < sortedProducts.length ? [otherSales] : [])];

  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Quantity Sold',
        data: barDataValues,
        backgroundColor: [
          '#0c4a6e', '#0369a1', '#0284c7', '#0ea5e9',
          '#38bdf8', '#7dd3fc', '#22d3ee', '#06b6d4',
          '#0891b2',
        ],
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  const pieColors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];
  const pieChartData = {
    labels: Object.keys(categoryStock),
    datasets: [
      {
        data: Object.values(categoryStock),
        backgroundColor: pieColors.slice(0, Object.keys(categoryStock).length),
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
    },
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Real-time overview of your shop.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</h3>
          <p className="text-xl font-extrabold mt-1 text-slate-800">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock</h3>
          <p className="text-xl font-extrabold mt-1 text-emerald-600">{totalStock}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bills</h3>
          <p className="text-xl font-extrabold mt-1 text-blue-600">{totalBills}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</h3>
          <p className="text-xl font-extrabold mt-1 text-emerald-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Most Selling Products</h3>
          {barDataValues.length > 0 ? (
            <Bar data={barChartData} options={barOptions} />
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No sales data yet.</p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Stock by Category</h3>
          {Object.keys(categoryStock).length > 0 ? (
            <Pie data={pieChartData} options={pieOptions} />
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No inventory data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
