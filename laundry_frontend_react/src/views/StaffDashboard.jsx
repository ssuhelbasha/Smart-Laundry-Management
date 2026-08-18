import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, MapPin, Phone, CheckSquare, Clock, Wallet, Droplets, Wind, XCircle } from 'lucide-react';

const StaffDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(user.walletBalance || 0);

  const [deliveryModal, setDeliveryModal] = useState({ isOpen: false, orderId: null });
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, walletRes] = await Promise.all([
        axios.get(`/api/orders?staffId=${user.userId}`),
        axios.get(`/api/wallet/${user.userId}`)
      ]);
      setOrders(ordersRes.data.filter(o => o.status !== 'Rejected')); // Hide rejected
      setWalletBalance(walletRes.data.walletBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => setOtpCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleInitiateDelivery = async (orderId) => {
    try {
      await axios.post(`/api/orders/${orderId}/request-delivery-otp`);
      setDeliveryModal({ isOpen: true, orderId });
      setOtpCooldown(30);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request delivery OTP");
      if (err.response?.status === 429) {
          setDeliveryModal({ isOpen: true, orderId });
      }
    }
  };

  const updateStatus = async (orderId, newStatus, submittedOtpCode = null) => {
    // If accepting a pending task, confirm they want to assign it to themselves
    if (newStatus === 'Picked Up' && !window.confirm("Confirm you want to pick up this order?")) return;
    if (newStatus === 'Rejected' && !window.confirm("Are you sure you want to reject this order? It will be refunded to the customer.")) return;

    if (newStatus === 'Delivered') setOtpLoading(true);
    try {
      const payload = { status: newStatus, staffId: user.userId };
      if (submittedOtpCode) payload.otpCode = submittedOtpCode;

      await axios.put(`/api/orders/${orderId}/status`, payload);
      
      if (newStatus === 'Delivered') {
        alert("Delivery verified successfully.\nOrder marked as Delivered.");
        setDeliveryModal({ isOpen: false, orderId: null });
        setOtpCode('');
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      if (newStatus === 'Delivered') setOtpLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-500';
      case 'Picked Up': return 'bg-blue-100 text-blue-700 border-blue-500';
      case 'Washing': return 'bg-indigo-100 text-indigo-700 border-indigo-500';
      case 'Drying': return 'bg-purple-100 text-purple-700 border-purple-500';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 mb-8">
        <div className="flex-1 flex items-center gap-4 bg-white/80 p-6 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Truck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Deliveries & Tasks</h2>
            <p className="text-gray-500 text-sm">Manage your assigned pickups and processing</p>
          </div>
        </div>

        <div className="md:w-64 bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-6 opacity-20"><Wallet size={100} /></div>
          <div className="relative z-10">
            <p className="text-teal-100 font-medium tracking-wide uppercase text-xs mb-1">My Earnings Wallet</p>
            <h3 className="text-4xl font-extrabold tracking-tight">₹{walletBalance.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center justify-between">
        <span>Active Work Queue</span>
        {loading && <span className="text-xs font-normal text-gray-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live</span>}
      </h3>

      {loading && orders.length === 0 ? (
        <div className="text-center py-12">
           <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-500 mt-3 font-medium">Loading tasks...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 glass-card shadow-inner">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckSquare size={40} className="text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-600">You're all caught up!</h3>
          <p className="text-gray-400 mt-2">No pending pickups or active laundry tasks at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => {
            const statusStyle = getStatusColor(order.status);
            
            return (
              <div key={order.orderId} className={`glass-card border-t-4 shadow-lg hover:shadow-xl transition-shadow duration-300 ${statusStyle.split(' ')[2]}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{order.orderId.substring(0,8)}</span>
                    <h4 className="font-bold text-lg mt-1 text-gray-800">{order.serviceType}</h4>
                    <p className="text-sm text-gray-500 font-medium">{order.fabricType} • {order.totalQuantity} items</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.split(' ').slice(0,2).join(' ')}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary w-5 h-5 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-gray-700">Customer: {order.customerName || order.userId.substring(0,8)}</p>
                      <p className="text-gray-500 mt-1">Ready for {order.status === 'Pending' ? 'pickup' : 'delivery'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                     <div className="flex items-center gap-3 text-gray-600">
                       <Clock className="text-primary w-5 h-5" />
                       <p>Scheduled: {new Date(order.pickupDate).toLocaleDateString()}</p>
                     </div>
                     <span className="text-lg font-bold text-gray-800">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                  {order.status === 'Pending' && (
                    <>
                      <button onClick={() => updateStatus(order.orderId, 'Picked Up')} className="btn-primary flex-1 py-3 text-sm font-bold">
                        <Truck size={16} className="inline mr-2 -mt-1"/> Mark Picked Up
                      </button>
                      <button onClick={() => updateStatus(order.orderId, 'Rejected')} className="py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-colors">
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  {order.status === 'Picked Up' && (
                    <button onClick={() => updateStatus(order.orderId, 'Washing')} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-md">
                      <Droplets size={16} className="inline mr-2 -mt-1"/> Start Washing
                    </button>
                  )}
                  {order.status === 'Washing' && (
                    <button onClick={() => updateStatus(order.orderId, 'Drying')} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-purple-500 hover:bg-purple-600 text-white transition-colors shadow-md">
                      <Wind size={16} className="inline mr-2 -mt-1"/> Move to Drying
                    </button>
                  )}
                  {order.status === 'Drying' && (
                    <button onClick={() => handleInitiateDelivery(order.orderId)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-600 text-white transition-colors shadow-md">
                      <CheckSquare size={16} className="inline mr-2 -mt-1"/> Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deliveryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setDeliveryModal({ isOpen: false, orderId: null })} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
              <XCircle size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Customer Delivery Verification</h3>
              <p className="text-gray-500 mt-2 text-sm">Please enter the 6-digit OTP provided by the customer to complete this delivery.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              
              <button 
                onClick={() => updateStatus(deliveryModal.orderId, 'Delivered', otpCode)}
                disabled={otpCode.length !== 6 || otpLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP & Mark Delivered'}
              </button>
              
              <button 
                onClick={() => handleInitiateDelivery(deliveryModal.orderId)}
                disabled={otpCooldown > 0}
                className="w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
              >
                {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
