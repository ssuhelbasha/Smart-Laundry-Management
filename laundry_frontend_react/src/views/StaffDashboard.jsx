import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, MapPin, Phone, CheckSquare, Clock } from 'lucide-react';

const StaffDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`/api/orders?staffId=${user.userId}`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, {
        status: newStatus,
        staffId: user.userId
      });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 p-5 rounded-2xl shadow-sm border border-white/50 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Deliveries & Tasks</h2>
            <p className="text-gray-500 text-sm">Manage your assigned pickups and drop-offs</p>
          </div>
        </div>
      </div>

      {loading ? (
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
          <p className="text-gray-400 mt-2">No pending pickups or deliveries assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => (
            <div key={order.orderId} className="glass-card border-t-4 shadow-lg hover:shadow-xl transition-shadow duration-300
                ${order.status === 'Pickup Pending' ? 'border-t-orange-500' : 
                  order.status === 'In Progress' ? 'border-t-blue-500' : 'border-t-green-500'}">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{order.orderId.substring(0,8)}</span>
                  <h4 className="font-bold text-lg mt-1 text-gray-800">{order.serviceType}</h4>
                  <p className="text-sm text-gray-500 font-medium">{order.fabricType} • {order.totalQuantity} items</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                    ${order.status === 'Pickup Pending' ? 'bg-orange-100 text-orange-700' : 
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border border-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary w-5 h-5 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-gray-700">Customer ID: {order.userId.substring(0,8)}</p>
                    <p className="text-gray-500 mt-1">Ready for {order.status === 'Pickup Pending' ? 'pickup' : 'delivery'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <Clock className="text-primary w-5 h-5" />
                   <p className="text-sm text-gray-600 font-medium">Scheduled Date: {new Date(order.pickupDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 mt-auto">
                {order.status === 'Pickup Pending' && (
                  <button onClick={() => updateStatus(order.orderId, 'In Progress')} className="btn-primary flex-1 py-3 text-sm font-bold tracking-wide">
                    Mark as Picked Up
                  </button>
                )}
                {order.status === 'In Progress' && (
                  <button onClick={() => updateStatus(order.orderId, 'Delivered')} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold tracking-wide bg-green-500 hover:bg-green-600 text-white transition-colors shadow-md">
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
