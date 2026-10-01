import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Package, Clock, CheckCircle, MapPin, CreditCard, Wallet, Droplets, Wind, Shirt } from 'lucide-react';

const OrderStepper = ({ status }) => {
  const steps = ['Pending', 'Picked Up', 'Washing', 'Drying', 'Delivered'];
  const currentIndex = steps.indexOf(status) === -1 ? (status === 'Rejected' ? -1 : 0) : steps.indexOf(status);

  if (status === 'Rejected') {
    return (
      <div className="flex items-center text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg mt-4">
        Order Rejected / Cancelled (Refunded)
      </div>
    );
  }

  return (
    <div className="w-full py-4 mt-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-500" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${isCompleted ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-gray-500'}
                ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={`absolute top-10 text-[10px] sm:text-xs font-semibold whitespace-nowrap
                ${isCurrent ? 'text-green-600' : (isCompleted ? 'text-gray-700' : 'text-gray-400')}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8"></div> {/* Spacer for the absolute text */}
    </div>
  );
};

const CustomerDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [basePrice, setBasePrice] = useState(2.00);
  const [walletBalance, setWalletBalance] = useState(user.walletBalance || 0);

  const [formData, setFormData] = useState({
    serviceType: 'Wash & Fold',
    fabricType: 'Cotton',
    totalQuantity: 1,
    pickupDate: ''
  });

  const [topupData, setTopupData] = useState({
    amount: 1000,
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const fetchData = async () => {
    try {
      const [ordersRes, priceRes, walletRes] = await Promise.all([
        axios.get(`/api/orders?userId=${user.userId}`),
        axios.get('/api/pricing'),
        axios.get(`/api/wallet/${user.userId}`)
      ]);
      setOrders(ordersRes.data);
      setBasePrice(priceRes.data.basePrice);
      setWalletBalance(walletRes.data.walletBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPriceMultiplier = (service, fabric) => {
    let multiplier = 1.0;
    if (service === 'Dry Clean') multiplier *= 2.0;
    if (service === 'Ironing') multiplier *= 1.5;
    if (fabric === 'Silk' || fabric === 'Wool') multiplier *= 1.5;
    return multiplier;
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (topupData.cardNumber.length < 16) return alert('Invalid card number');
    
    try {
      const res = await axios.post('/api/wallet/topup', {
        userId: user.userId,
        amount: parseFloat(topupData.amount)
      });
      if (res.data.success) {
        setWalletBalance(res.data.walletBalance);
        setShowTopup(false);
        setTopupData({ amount: 1000, cardNumber: '', expiry: '', cvv: '' });
      }
    } catch (err) {
      alert("Failed to top-up wallet");
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const estPrice = basePrice * getPriceMultiplier(formData.serviceType, formData.fabricType) * formData.totalQuantity;
    
    if (walletBalance < estPrice) {
      alert(`Insufficient funds! Your balance is ₹${walletBalance.toFixed(2)}, but the order costs ₹${estPrice.toFixed(2)}. Please add funds.`);
      setShowNewOrder(false);
      setShowTopup(true);
      return;
    }

    try {
      await axios.post('/api/orders', {
        ...formData,
        userId: user.userId,
        totalPrice: estPrice
      });
      setShowNewOrder(false);
      fetchData(); // Refreshes orders and wallet
      setFormData({ ...formData, totalQuantity: 1, pickupDate: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create order");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Wallet Section */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4">
        <div className="flex-1 bg-white/80 p-6 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-gray-800">My Dashboard</h2>
          <p className="text-gray-500 text-sm">Manage your laundry requests seamlessly</p>
        </div>
        
        <div className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-10 opacity-20"><Wallet size={120} /></div>
          <div className="relative z-10">
            <p className="text-blue-100 font-medium tracking-wide uppercase text-xs mb-1">Smart Wallet Balance</p>
            <h3 className="text-4xl font-extrabold tracking-tight">₹{walletBalance.toFixed(2)}</h3>
          </div>
          <button onClick={() => setShowTopup(!showTopup)} className="relative z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10">
            <PlusCircle size={18} /> Add Funds
          </button>
        </div>
      </div>

      {/* Topup Modal */}
      {showTopup && (
        <div className="glass-card border-t-4 border-t-indigo-500 shadow-2xl relative overflow-hidden">
          <button onClick={() => setShowTopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">✕</button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><CreditCard size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Top-Up Wallet</h3>
              <p className="text-gray-500 text-sm">Secure dummy payment gateway</p>
            </div>
          </div>
          <form onSubmit={handleTopup} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" min="1" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm font-bold text-lg"
                    value={topupData.amount} onChange={e => setTopupData({...topupData, amount: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label>
                  <input type="text" placeholder="1234 5678 9101 1121" minLength="16" maxLength="19" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm font-mono tracking-widest"
                    value={topupData.cardNumber} onChange={e => setTopupData({...topupData, cardNumber: e.target.value.replace(/\D/g,'')})} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                  <input type="text" placeholder="MM/YY" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    value={topupData.expiry} onChange={e => setTopupData({...topupData, expiry: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CVV</label>
                  <input type="password" placeholder="***" minLength="3" maxLength="4" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    value={topupData.cvv} onChange={e => setTopupData({...topupData, cvv: e.target.value})} />
               </div>
            </div>
            <button type="submit" className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md mt-4">
              Pay ₹{topupData.amount}
            </button>
          </form>
        </div>
      )}

      {/* New Order Button */}
      {!showNewOrder && !showTopup && (
        <button onClick={() => setShowNewOrder(true)} className="btn-primary flex items-center justify-center w-full sm:w-auto px-8 gap-2 shadow-lg hover:shadow-blue-500/20">
          <PlusCircle size={20} /> Schedule New Pickup
        </button>
      )}

      {/* New Order Form */}
      {showNewOrder && (
        <div className="glass-card border-t-4 border-t-primary shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Schedule a Pickup</h3>
            <button onClick={() => setShowNewOrder(false)} className="text-gray-400 hover:text-red-500">✕ Cancel</button>
          </div>
          
          <form onSubmit={handleCreateOrder} className="space-y-6">
            
            {/* Visual Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Service</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div onClick={() => setFormData({...formData, serviceType: 'Wash & Fold'})} 
                     className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center gap-2
                     ${formData.serviceType === 'Wash & Fold' ? 'border-primary bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                  <Droplets size={32} className={formData.serviceType === 'Wash & Fold' ? 'text-primary' : 'text-gray-400'}/>
                  <span className="font-bold">Wash & Fold</span>
                  <span className="text-xs opacity-70">Standard everyday laundry</span>
                </div>
                
                <div onClick={() => setFormData({...formData, serviceType: 'Dry Clean'})} 
                     className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center gap-2
                     ${formData.serviceType === 'Dry Clean' ? 'border-primary bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                  <Shirt size={32} className={formData.serviceType === 'Dry Clean' ? 'text-primary' : 'text-gray-400'}/>
                  <span className="font-bold">Dry Clean</span>
                  <span className="text-xs opacity-70">Premium care for delicates</span>
                </div>

                <div onClick={() => setFormData({...formData, serviceType: 'Ironing'})} 
                     className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center gap-2
                     ${formData.serviceType === 'Ironing' ? 'border-primary bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                  <Wind size={32} className={formData.serviceType === 'Ironing' ? 'text-primary' : 'text-gray-400'}/>
                  <span className="font-bold">Ironing Only</span>
                  <span className="text-xs opacity-70">Crisp pressing service</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Fabric Type</label>
                <select className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm"
                  value={formData.fabricType} onChange={e => setFormData({...formData, fabricType: e.target.value})}>
                  <option>Cotton</option>
                  <option>Silk</option>
                  <option>Wool</option>
                  <option>Synthetic</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Quantity (pieces/kg)</label>
                <input type="number" min="1" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm"
                  value={formData.totalQuantity} onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Pickup Date</label>
                <input type="date" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm"
                  value={formData.pickupDate} onChange={e => setFormData({...formData, pickupDate: e.target.value})} />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center border border-blue-100 shadow-sm mt-2">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin size={18} />
                <span className="font-semibold">Pickup Address: {user?.address}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <span className="text-gray-500 font-medium">Est. Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{(basePrice * getPriceMultiplier(formData.serviceType, formData.fabricType) * formData.totalQuantity).toFixed(2)}
                </span>
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-full py-4 text-lg shadow-lg">Confirm & Pay from Wallet</button>
          </form>
        </div>
      )}

      {/* Orders List */}
      <h3 className="text-lg font-bold text-gray-700 mt-10 mb-4 flex items-center justify-between">
        <span>Order History & Tracking</span>
        {loading && <span className="text-xs font-normal text-gray-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live</span>}
      </h3>

      {loading && orders.length === 0 ? (
        <div className="text-center py-12">
           <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-500 mt-3 font-medium">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 glass-card bg-gray-50/50 shadow-inner">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Package size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-600">No active orders</h3>
          <p className="text-gray-400 mt-2">Time to freshen up your wardrobe. Schedule a pickup today!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map(order => (
            <div key={order.orderId} className="glass-card shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group p-0">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-primary">
                      {order.serviceType.includes('Wash') ? <Droplets size={24} /> : order.serviceType.includes('Iron') ? <Wind size={24}/> : <Shirt size={24}/>}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 tracking-wider">ORDER #{order.orderId.substring(0,8)}</span>
                      <h4 className="font-bold text-lg text-gray-800">{order.serviceType}</h4>
                      <p className="text-sm text-gray-500 font-medium">{order.fabricType} • {order.totalQuantity} items</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right mt-4 sm:mt-0">
                    <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                    <span className="font-extrabold text-2xl text-gray-800">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tracking Stepper */}
                <div className="px-2 sm:px-6 pb-2">
                   <h5 className="text-sm font-bold text-gray-700 mb-2">Tracking Status</h5>
                   <OrderStepper status={order.status} />
                </div>
              </div>
              
              <div className="bg-gray-50/80 p-4 px-6 border-t border-gray-100 flex flex-wrap justify-between items-center text-sm font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" /> Scheduled: {new Date(order.pickupDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className={order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-orange-400'} /> 
                  Payment: {order.paymentStatus}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
