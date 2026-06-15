import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Settings, TrendingUp, Search } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [pricing, setPricing] = useState(2.00);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, priceRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/users'),
        axios.get('/api/pricing')
      ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setPricing(priceRes.data.basePrice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/pricing', { basePrice: parseFloat(pricing) });
      alert('Pricing updated successfully');
    } catch (err) {
      alert('Failed to update pricing');
    }
  };

  const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  
  // Stats for cards
  const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card flex flex-col p-5 border-t-4 border-blue-500 shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Orders</p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FileText size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{orders.length}</h3>
          <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-2 py-1 rounded w-fit">{pendingOrders} active</p>
        </div>
        
        <div className="glass-card flex flex-col p-5 border-t-4 border-green-500 shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Revenue</p>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800">${revenue.toFixed(2)}</h3>
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded w-fit">Total earnings</p>
        </div>
        
        <div className="glass-card flex flex-col p-5 border-t-4 border-purple-500 shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Users</p>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Users size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{users.length}</h3>
          <p className="text-xs text-purple-600 mt-2 font-medium bg-purple-50 inline-block px-2 py-1 rounded w-fit">Registered accounts</p>
        </div>
      </div>

      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all ${activeTab === 'orders' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('orders')}>
          Orders Management
        </button>
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all ${activeTab === 'users' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('users')}>
          User Directory
        </button>
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('settings')}>
          System Settings
        </button>
      </div>

      <div className="glass-card shadow-lg p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4 font-medium">Loading admin data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                      <th className="p-5">Order ID</th>
                      <th className="p-5">Service details</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Amount</th>
                      <th className="p-5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.orderId} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5 text-sm font-bold text-gray-900">#{order.orderId.substring(0,8)}</td>
                        <td className="p-5">
                          <p className="text-sm font-semibold text-gray-800">{order.serviceType}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.fabricType} • {order.totalQuantity} items</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-block
                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-5 text-sm font-bold text-gray-900">${order.totalPrice.toFixed(2)}</td>
                        <td className="p-5 text-sm text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                      <th className="p-5">User Details</th>
                      <th className="p-5">Contact</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.userId} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                        </td>
                        <td className="p-5 text-sm text-gray-600 font-medium">{u.phone}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                            ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                              u.role === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-xs text-gray-400 font-mono">{u.userId.substring(0,8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-8 max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Settings size={24}/>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Pricing Configuration</h3>
                    <p className="text-sm text-gray-500 mt-1">Update global pricing settings</p>
                  </div>
                </div>
                
                <form onSubmit={handleUpdatePrice} className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Base Price per Item/Kg ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" step="0.01" min="0.1" value={pricing} onChange={e => setPricing(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm text-lg font-semibold" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-lg mt-2">Save Pricing Configuration</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
