import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../lib/format';
import { adminApi } from '../../lib/api';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
  });

  useEffect(() => {
    adminApi.stats().then(data => {
      const newStatus = data.ordersByStatus?.find(s => s.status === 'new');
      setStats({
        totalRevenue: data.totalRevenue,
        totalOrders: data.totalOrders,
        pendingOrders: newStatus?.cnt ?? 0,
        totalProducts: data.totalProducts,
        activeProducts: data.activeProducts,
      });
    }).catch(console.error);
  }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon }) => (
    <div className="bg-white p-6 border border-gray-200 rounded shadow-sm flex items-start justify-between">
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.1em] text-gray-500 mb-2">{title}</p>
        <h3 className="font-serif text-3xl text-jet mb-1">{value}</h3>
        {subtitle && <p className="font-sans text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="p-3 bg-gray-50 rounded-full">
        <Icon className="w-6 h-6 text-gold" />
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="font-serif text-3xl text-jet mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="From confirmed/fulfilled orders"
          icon={DollarSign}
        />
        <StatCard
          title="New Orders"
          value={stats.pendingOrders}
          subtitle={`Out of ${stats.totalOrders} total`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`${stats.activeProducts} active`}
          icon={Package}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle="All time"
          icon={TrendingUp}
        />
      </div>

      <div className="bg-white p-8 border border-gray-200 rounded shadow-sm text-center">
        <h2 className="font-serif text-2xl text-jet mb-4">Welcome to Sultan Perfumes Admin</h2>
        <p className="font-sans text-gray-500 max-w-2xl mx-auto leading-relaxed">
          All data is now persisted in the SQLite database. Products, orders, offers, and settings
          are shared across all sessions and devices.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
