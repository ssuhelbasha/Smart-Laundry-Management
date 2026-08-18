import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, User, FileText, Settings, TrendingUp, Search, Wallet, DollarSign, 
  ArrowRight, UserCheck, CheckCircle2, XCircle, Clock, MapPin, 
  Camera, Eye, AlertCircle, Phone, Mail, X, Sparkles, Building
} from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [approvedStaffList, setApprovedStaffList] = useState([]);
  const [staffApplications, setStaffApplications] = useState([]);
  const [pricing, setPricing] = useState(2.00);
  const [adminWallet, setAdminWallet] = useState(user.walletBalance || 0);
  const [loading, setLoading] = useState(true);

  // Staff application filter & modal state
  const [staffFilter, setStaffFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [previewPhoto, setPreviewPhoto] = useState(null); // { url, title, description }
  const [actionLoading, setActionLoading] = useState({});

  // Transfer State
  const [transferStaffId, setTransferStaffId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, priceRes, walletRes, staffRes, approvedStaffRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/users'),
        axios.get('/api/pricing'),
        axios.get(`/api/wallet/${user.userId}`),
        axios.get('/api/admin/staff-applications').catch(() => ({ data: [] })),
        axios.get('/api/users?role=staff&status=approved').catch(() => ({ data: [] }))
      ]);
      setOrders(ordersRes.data || []);
      setUsersList(usersRes.data || []);
      setPricing(priceRes.data?.basePrice || 2.00);
      setAdminWallet(walletRes.data?.walletBalance || 0);
      setStaffApplications(staffRes.data || []);
      setApprovedStaffList(approvedStaffRes.data || []);
    } catch (err) {
      console.error("Admin fetchData error:", err);
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

  // Staff Approval Action
  const handleApproveStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to APPROVE ${staffName} as a Staff Member? An email notification will be sent.`)) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [staffId]: true }));
    try {
      const res = await axios.post(`/api/admin/staff-applications/${staffId}/approve`);
      alert(res.data.message || `${staffName} approved successfully!`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve staff");
    } finally {
      setActionLoading(prev => ({ ...prev, [staffId]: false }));
    }
  };

  // Staff Rejection Action
  const handleRejectStaff = async (staffId, staffName) => {
    const reason = window.prompt(`Enter rejection reason for ${staffName}:`, "Submitted photos or facility location criteria not met.");
    if (reason === null) return; // cancelled

    setActionLoading(prev => ({ ...prev, [staffId]: true }));
    try {
      const res = await axios.post(`/api/admin/staff-applications/${staffId}/reject`, { 
        reason
      });
      alert(res.data.message || `Application for ${staffName} rejected.`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject staff application");
    } finally {
      setActionLoading(prev => ({ ...prev, [staffId]: false }));
    }
  };

  const revenue = orders.reduce((sum, o) => o.status === 'Delivered' ? sum + (o.totalPrice || 0) : sum, 0);
  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected').length;
  
  // Use the approved staff list from the backend API
  const approvedStaffMembers = approvedStaffList;
  const pendingStaffCount = staffApplications.filter(s => s.status === 'pending').length;

  const getUsername = (id) => {
    const u = usersList.find(x => x.userId === id);
    return u ? u.name : 'Unknown User';
  };

  // Simple Analytics Calculation
  const servicesData = [
    { name: 'Wash & Fold', count: orders.filter(o => o.serviceType === 'Wash & Fold' || o.service_type === 'Wash & Fold').length },
    { name: 'Dry Clean', count: orders.filter(o => o.serviceType === 'Dry Clean' || o.service_type === 'Dry Clean').length },
    { name: 'Ironing', count: orders.filter(o => o.serviceType === 'Ironing' || o.service_type === 'Ironing').length },
  ];
  const maxServiceCount = Math.max(...servicesData.map(s => s.count), 1);

  // Filter staff applications
  const filteredStaffApplications = staffApplications.filter(app => {
    if (staffFilter === 'all') return true;
    return app.status === staffFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Lightbox / Modal for Photo Previews */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative animate-scale-up">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{previewPhoto.title}</h3>
                <p className="text-xs text-gray-300">{previewPhoto.description}</p>
              </div>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-950 flex items-center justify-center max-h-[75vh]">
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.title} 
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
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
        
        {/* Staff Approval Metric Card */}
        <div 
          onClick={() => setActiveTab('staff-approvals')}
          className="glass-card flex flex-col p-5 border-t-4 border-amber-500 shadow-md cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Staff Approvals</p>
            <div className={`p-2 rounded-lg ${pendingStaffCount > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-800">{pendingStaffCount}</h3>
            <span className="text-xs text-gray-500 font-medium">pending review</span>
          </div>
          <p className={`text-xs mt-2 font-semibold px-2 py-1 rounded w-fit ${
            pendingStaffCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-50 text-green-700'
          }`}>
            {pendingStaffCount > 0 ? 'Requires Action →' : 'All applications reviewed'}
          </p>
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

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 custom-scrollbar">
        <button 
          className={`flex-1 py-3 px-5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-blue-50 text-primary shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-50'
          }`} 
          onClick={() => setActiveTab('orders')}
        >
          Orders Management
        </button>

        {/* Staff Approvals Tab Button with Notification Badge */}
        <button 
          className={`flex-1 py-3 px-5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'staff-approvals' ? 'bg-amber-50 text-amber-800 shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-50'
          }`} 
          onClick={() => setActiveTab('staff-approvals')}
        >
          <span>Staff Approvals</span>
          {pendingStaffCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow-sm">
              {pendingStaffCount}
            </span>
          )}
        </button>

        <button 
          className={`flex-1 py-3 px-5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'payouts' ? 'bg-indigo-50 text-indigo-600 shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-50'
          }`} 
          onClick={() => setActiveTab('payouts')}
        >
          Staff Payouts
        </button>

        <button 
          className={`flex-1 py-3 px-5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-blue-50 text-primary shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-50'
          }`} 
          onClick={() => setActiveTab('users')}
        >
          User Directory
        </button>

        <button 
          className={`flex-1 py-3 px-5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-blue-50 text-primary shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-50'
          }`} 
          onClick={() => setActiveTab('settings')}
        >
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
            {/* ================= 1. ORDERS TAB ================= */}
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
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
                      <tr key={order.orderId || order.order_id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5">
                           <p className="text-sm font-bold text-gray-900">#{(order.orderId || order.order_id || '').substring(0,8)}</p>
                           <p className="text-xs text-blue-600 font-semibold mt-1">{getUsername(order.userId || order.user_id)}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-semibold text-gray-800">{order.serviceType || order.service_type}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.fabricType || order.fabric_type} • {order.totalQuantity || order.total_quantity} items</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-block
                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-5 text-sm font-bold text-gray-900">₹{(order.totalPrice || order.total_price || 0).toFixed(2)}</td>
                        <td className="p-5 text-sm text-gray-500 font-medium">
                          {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= 2. STAFF APPROVALS TAB ================= */}
            {activeTab === 'staff-approvals' && (
              <div className="p-6">
                
                {/* Header & Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <UserCheck className="text-amber-600" /> Staff Partner Applications & Verification
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Review photos of staff, washing machines, laundry utilities, and facility location to approve or reject registrations.
                    </p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'pending', label: `Pending (${pendingStaffCount})` },
                      { key: 'approved', label: 'Approved' },
                      { key: 'rejected', label: 'Rejected' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setStaffFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          staffFilter === f.key 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredStaffApplications.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h4 className="font-bold text-gray-700">No staff applications found</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {staffFilter === 'pending' 
                        ? 'No staff registrations are currently waiting for admin approval.' 
                        : 'No records matching the selected status filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredStaffApplications.map(staff => (
                      <div 
                        key={staff.userId} 
                        className={`p-6 rounded-2xl border transition-all ${
                          staff.status === 'pending' 
                            ? 'bg-amber-50/40 border-amber-200 shadow-sm' 
                            : staff.status === 'approved' 
                              ? 'bg-white border-green-200' 
                              : 'bg-gray-50 border-gray-200 opacity-90'
                        }`}
                      >
                        {/* Application Header Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200/80 pb-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                              {staff.staffPhoto ? (
                                <img src={staff.staffPhoto} alt={staff.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {staff.name}
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  staff.status === 'approved' 
                                    ? 'bg-green-100 text-green-700' 
                                    : staff.status === 'rejected' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-amber-100 text-amber-800 animate-pulse'
                                }`}>
                                  {staff.status === 'pending' ? 'Pending Approval' : staff.status}
                                </span>
                              </h4>
                              <p className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1"><Mail size={13} /> {staff.email}</span>
                                <span className="flex items-center gap-1"><Phone size={13} /> {staff.phone}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {staff.status !== 'approved' && (
                              <button
                                onClick={() => handleApproveStaff(staff.userId, staff.name)}
                                disabled={actionLoading[staff.userId]}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 size={16} /> Approve Staff
                              </button>
                            )}

                            {staff.status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectStaff(staff.userId, staff.name)}
                                disabled={actionLoading[staff.userId]}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle size={16} /> Reject Application
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Location & Details Info */}
                        <div className="mb-4 bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex items-start gap-2 text-xs text-gray-700">
                            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-gray-900">Facility Location & Address: </span>
                              <span>{staff.locationDetails || staff.address || 'Address not specified'}</span>
                            </div>
                          </div>
                          {staff.rejectionReason && (
                            <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-100">
                              Rejection Reason: {staff.rejectionReason}
                            </div>
                          )}
                        </div>



                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= 3. PAYOUTS TAB ================= */}
            {activeTab === 'payouts' && (
              <div className="p-8">
                 <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-800">Staff Commission Payouts</h3>
                      <p className="text-gray-500 mt-2">Transfer funds from the Admin Escrow Wallet directly to approved staff members.</p>
                    </div>

                    <div className="glass-card shadow-lg border-2 border-indigo-100 p-6 rounded-2xl bg-white mb-8">
                       <h4 className="font-bold text-gray-700 mb-4">Execute Transfer</h4>
                       <form onSubmit={handleTransfer} className="space-y-4">
                         <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Select Approved Staff Member</label>
                           <select 
                             required 
                             className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
                             value={transferStaffId} 
                             onChange={e => setTransferStaffId(e.target.value)}
                           >
                             <option value="">-- Choose an approved staff partner --</option>
                             {approvedStaffMembers.map(s => (
                               <option key={s.userId} value={s.userId}>
                                 {s.name} (Wallet: ₹{s.walletBalance?.toFixed(2) || '0.00'})
                               </option>
                             ))}
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Transfer Amount (₹)</label>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                             <input 
                               type="number" 
                               step="0.01" 
                               min="1" 
                               max={adminWallet} 
                               required 
                               className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm text-lg font-semibold"
                               value={transferAmount} 
                               onChange={e => setTransferAmount(e.target.value)} 
                             />
                           </div>
                         </div>
                         <button 
                           type="submit" 
                           className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md mt-2 flex justify-center items-center gap-2"
                         >
                            Send Funds <ArrowRight size={20} />
                         </button>
                       </form>
                    </div>

                    <h4 className="font-bold text-gray-700 mb-4">Approved Staff Directory</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {approvedStaffMembers.map(s => (
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
                      {approvedStaffMembers.length === 0 && <p className="text-gray-500 text-sm">No approved staff members found in the system.</p>}
                    </div>
                 </div>
              </div>
            )}

            {/* ================= 4. USER DIRECTORY TAB ================= */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                      <th className="p-5">User Details</th>
                      <th className="p-5">Wallet Balance</th>
                      <th className="p-5">Role & Approval</th>
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
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                              ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                u.role === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                              {u.role}
                            </span>
                            {u.role === 'staff' && (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                u.status === 'approved' 
                                  ? 'bg-green-100 text-green-700' 
                                  : u.status === 'rejected' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {u.status || 'pending'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-xs text-gray-400 font-mono">{u.userId.substring(0,8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= 5. SETTINGS TAB ================= */}
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
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.1" 
                        value={pricing} 
                        onChange={e => setPricing(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm text-lg font-semibold" 
                      />
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
