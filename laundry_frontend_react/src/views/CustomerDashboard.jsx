import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Package, Clock, CheckCircle, MapPin } from 'lucide-react';

const CustomerDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [basePrice, setBasePrice] = useState(2.00);

  const [formData, setFormData] = useState({
    serviceType: 'Wash & Fold',
    fabricType: 'Cotton',
    totalQuantity: 1,
    pickupDate: ''
  });

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`/api/orders?userId=${user.userId}`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await axios.get('/api/pricing');
      setBasePrice(res.data.basePrice);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPricing();
  }, []);

  const getPriceMultiplier = (service, fabric) => {
    let multiplier = 1.0;
    if (service === 'Dry Clean') multiplier *= 2.0;
    if (service === 'Ironing') multiplier *= 1.5;
    if (fabric === 'Silk' || fabric === 'Wool') multiplier *= 1.5;
    return multiplier;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const estPrice = basePrice * getPriceMultiplier(formData.serviceType, formData.fabricType) * formData.totalQuantity;
    try {
      await axios.post('/api/orders', {
        ...formData,
        userId: user.userId,
        totalPrice: estPrice
      });
      setShowNewOrder(false);
      fetchOrders();
      setFormData({ ...formData, totalQuantity: 1, pickupDate: '' });
    } catch (err) {
      alert("Failed to create order");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pickup Pending': return 'text-orange-600 bg-orange-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Dashboard</h2>
          <p className="text-gray-500 text-sm">Manage your laundry requests seamlessly</p>
        </div>
        <button onClick={() => setShowNewOrder(!showNewOrder)} className="btn-primary flex items-center gap-2">
          <PlusCircle size={20} />
          {showNewOrder ? 'Cancel Request' : 'New Order'}
        </button>
      </div>

      {showNewOrder && (
        <div className="glass-card border-t-4 border-t-primary shadow-2xl">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Schedule a Pickup</h3>
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Service Type</label>
              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary shadow-sm"
                value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                <option>Wash & Fold</option>
                <option>Dry Clean</option>
                <option>Ironing</option>
              </select>
            </div>
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
            
            <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center border border-blue-100 shadow-sm mt-2">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin size={18} />
                <span className="font-semibold">Pickup Address: {user?.address}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <span className="text-gray-500 font-medium">Est. Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ${(basePrice * getPriceMultiplier(formData.serviceType, formData.fabricType) * formData.totalQuantity).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full py-4 text-lg">Confirm & Schedule</button>
            </div>
          </form>
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-700 mt-8 mb-4">Recent Orders</h3>

      {loading ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.orderId} className="glass-card hover:-translate-y-1 transition-transform duration-300 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{order.serviceType}</h4>
                  <p className="text-sm text-gray-500 font-medium">{order.fabricType} • {order.totalQuantity} items</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 gap-2 font-medium">
                  <Clock size={16} className="text-primary" /> Pickup: {new Date(order.pickupDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-2 font-medium">
                  <CheckCircle size={16} className={order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-gray-400'} /> 
                  Payment: {order.paymentStatus}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400">ID: {order.orderId.substring(0, 8)}</span>
                <span className="font-bold text-xl text-primary">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
