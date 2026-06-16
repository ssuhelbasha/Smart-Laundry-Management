import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Settings, TrendingUp, Search, Wallet, DollarSign, ArrowRight } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pricing, setPricing] = useState(2.00);
  const [adminWallet, setAdminWallet] = useState(user.walletBalance || 0);
  const [loading, setLoading] = useState(true);

  // Transfer State
  const [transferStaffId, setTransferStaffId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, priceRes, walletRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/users'),
        axios.get('/api/pricing'),
        axios.get(`/api/wallet/${user.userId}`)
      ]);
      setOrders(ordersRes.data);
      setUsersList(usersRes.data);
      setPricing(priceRes.data.basePrice);
      setAdminWallet(walletRes.data.walletBalance);
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

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferStaffId || !transferAmount || transferAmount <= 0) return alert("Invalid transfer details");
    if (transferAmount > adminWallet) return alert("Insufficient admin wallet balance");

    try {
      const res = await axios.post('/api/wallet/transfer', {
        adminId: user.userId,
        staffId: transferStaffId,
        amount: parseFloat(transferAmount)
      });
      if (res.data.success) {
        alert("Transfer successful!");
        setTransferAmount('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    }
  };

  const revenue = orders.reduce((sum, o) => o.status === 'Delivered' ? sum + (o.totalPrice || 0) : sum, 0);
  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected').length;
  
  const staffMembers = usersList.filter(u => u.role === 'staff');

  const getUsername = (id) => {
    const u = usersList.find(x => x.userId === id);
    return u ? u.name : 'Unknown User';
  };

  // Simple Analytics Calculation
  const servicesData = [
    { name: 'Wash & Fold', count: orders.filter(o => o.serviceType === 'Wash & Fold').length },
    { name: 'Dry Clean', count: orders.filter(o => o.serviceType === 'Dry Clean').length },
    { name: 'Ironing', count: orders.filter(o => o.serviceType === 'Ironing').length },
  ];
  const maxServiceCount = Math.max(...servicesData.map(s => s.count), 1);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Gross Revenue</p>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800">₹{revenue.toFixed(2)}</h3>
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded w-fit">From delivered orders</p>
        </div>
        
        <div className="glass-card flex flex-col p-5 border-t-4 border-purple-500 shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Users</p>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Users size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{usersList.length}</h3>
          <p className="text-xs text-purple-600 mt-2 font-medium bg-purple-50 inline-block px-2 py-1 rounded w-fit">Registered accounts</p>
        </div>

        <div className="glass-card flex flex-col p-5 border-t-4 border-indigo-500 shadow-md bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-indigo-500 font-semibold uppercase tracking-wider">Admin Escrow Wallet</p>
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Wallet size={20} /></div>
          </div>
          <h3 className="text-3xl font-bold text-indigo-800">₹{adminWallet.toFixed(2)}</h3>
          <p className="text-xs text-indigo-600 mt-2 font-medium bg-indigo-100 inline-block px-2 py-1 rounded w-fit">Available for Payouts</p>
        </div>
      </div>

      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 custom-scrollbar">
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('orders')}>
          Orders Management
        </button>
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${activeTab === 'payouts' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('payouts')}>
          Staff Payouts
        </button>
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('users')}>
          User Directory
        </button>
        <button className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('settings')}>
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
                {/* CSS Analytics Chart inside Orders Tab */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                   <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Service Popularity Analytics</h4>
                   <div className="space-y-3">
                     {servicesData.map(service => (
                       <div key={service.name} className="flex items-center gap-4">
                         <div className="w-24 text-xs font-bold text-gray-500">{service.name}</div>
                         <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(service.count / maxServiceCount) * 100}%`}}></div>
                         </div>
                         <div className="w-8 text-xs font-bold text-gray-800 text-right">{service.count}</div>
                       </div>
                     ))}
                   </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                      <th className="p-5">Order ID & Customer</th>
                      <th className="p-5">Service details</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Amount</th>
                      <th className="p-5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.orderId} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5">
                           <p className="text-sm font-bold text-gray-900">#{order.orderId.substring(0,8)}</p>
                           <p className="text-xs text-blue-600 font-semibold mt-1">{getUsername(order.userId)}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-semibold text-gray-800">{order.serviceType}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.fabricType} • {order.totalQuantity} items</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-block
                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-5 text-sm font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</td>
                        <td className="p-5 text-sm text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="p-8">
                 <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-800">Staff Commission Payouts</h3>
                      <p className="text-gray-500 mt-2">Transfer funds from the Admin Escrow Wallet directly to staff members.</p>
                    </div>

                    <div className="glass-card shadow-lg border-2 border-indigo-100 p-6 rounded-2xl bg-white mb-8">
                       <h4 className="font-bold text-gray-700 mb-4">Execute Transfer</h4>
                       <form onSubmit={handleTransfer} className="space-y-4">
                         <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Select Staff Member</label>
                           <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
                             value={transferStaffId} onChange={e => setTransferStaffId(e.target.value)}>
                             <option value="">-- Choose a staff member --</option>
                             {staffMembers.map(s => (
                               <option key={s.userId} value={s.userId}>{s.name} (Current Wallet: ₹{s.walletBalance?.toFixed(2) || '0.00'})</option>
                             ))}
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Transfer Amount (₹)</label>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                             <input type="number" step="0.01" min="1" max={adminWallet} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm text-lg font-semibold"
                               value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                           </div>
                         </div>
                         <button type="submit" className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md mt-2 flex justify-center items-center gap-2">
                            Send Funds <ArrowRight size={20} />
                         </button>
                       </form>
                    </div>

                    <h4 className="font-bold text-gray-700 mb-4">Staff Directory</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {staffMembers.map(s => (
                        <div key={s.userId} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase">Wallet</p>
                            <p className="font-bold text-indigo-600">₹{s.walletBalance?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      ))}
                      {staffMembers.length === 0 && <p className="text-gray-500 text-sm">No staff members found in the system.</p>}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                      <th className="p-5">User Details</th>
                      <th className="p-5">Wallet Balance</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersList.map(u => (
                      <tr key={u.userId} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{u.email} • {u.phone}</p>
                        </td>
                        <td className="p-5 text-sm font-bold text-green-600">₹{u.walletBalance?.toFixed(2) || '0.00'}</td>
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">Base Price per Item/Kg (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
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
