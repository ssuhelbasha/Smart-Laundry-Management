const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'mock_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- REST API ENDPOINTS ---

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  
  res.json({ success: true, user: {
    userId: data.user_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: data.role
  }});
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  
  const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ 
      user_id: userId, 
      name, 
      email, 
      password, 
      phone, 
      address, 
      role: role || 'customer' 
    }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, user: {
    userId: data.user_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: data.role
  }});
});

// Get Users (Admin)
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, name, email, phone, address, role');

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
  
  const mappedUsers = data.map(u => ({
    userId: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    role: u.role
  }));
  res.json(mappedUsers);
});

// Get Pricing
app.get('/api/pricing', async (req, res) => {
  const { data, error } = await supabase
    .from('pricing')
    .select('base_price')
    .limit(1)
    .single();

  if (error || !data) {
    return res.json({ basePrice: 2.00 }); // default fallback
  }
  res.json({ basePrice: parseFloat(data.base_price) });
});

// Update Pricing (Admin)
app.put('/api/pricing', async (req, res) => {
  const { basePrice } = req.body;
  if (typeof basePrice !== 'number' || basePrice <= 0) {
    return res.status(400).json({ success: false, message: "Invalid base price value" });
  }
  
  // Update the first row
  const { data, error } = await supabase
    .from('pricing')
    .update({ base_price: basePrice })
    .eq('id', 1) // Assuming single row with id 1
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
  
  res.json({ success: true, pricing: { basePrice: parseFloat(data.base_price) } });
});

// Get Orders
app.get('/api/orders', async (req, res) => {
  const { userId, staffId } = req.query;
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (staffId) {
    query = query.or(`assigned_staff_id.eq.${staffId},status.eq.Pickup Pending,assigned_staff_id.is.null`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });

  const mappedOrders = data.map(o => ({
    orderId: o.order_id,
    userId: o.user_id,
    serviceType: o.service_type,
    fabricType: o.fabric_type,
    totalQuantity: o.total_quantity,
    pickupDate: o.pickup_date,
    status: o.status,
    totalPrice: parseFloat(o.total_price),
    paymentStatus: o.payment_status,
    assignedStaffId: o.assigned_staff_id,
    createdAt: o.created_at
  }));
  res.json(mappedOrders);
});

// Create Order
app.post('/api/orders', async (req, res) => {
  const { userId, serviceType, fabricType, totalQuantity, pickupDate, totalPrice } = req.body;
  
  const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
  
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      order_id: orderId,
      user_id: userId,
      service_type: serviceType,
      fabric_type: fabricType,
      total_quantity: parseInt(totalQuantity) || 1,
      pickup_date: pickupDate,
      status: "Pickup Pending",
      total_price: parseFloat(totalPrice) || 0.00,
      payment_status: "Pending",
      assigned_staff_id: null,
      created_at: Date.now()
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.json({ success: true, order: {
    orderId: data.order_id,
    userId: data.user_id,
    serviceType: data.service_type,
    fabricType: data.fabric_type,
    totalQuantity: data.total_quantity,
    pickupDate: data.pickup_date,
    status: data.status,
    totalPrice: parseFloat(data.total_price),
    paymentStatus: data.payment_status,
    assignedStaffId: data.assigned_staff_id,
    createdAt: data.created_at
  }});
});

// Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status, staffId } = req.body;
  
  let updateData = {};
  if (status) updateData.status = status;
  if (staffId) updateData.assigned_staff_id = staffId;
  if (status === "Delivered") updateData.payment_status = "Paid";

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order: {
    orderId: data.order_id,
    userId: data.user_id,
    serviceType: data.service_type,
    fabricType: data.fabric_type,
    totalQuantity: data.total_quantity,
    pickupDate: data.pickup_date,
    status: data.status,
    totalPrice: parseFloat(data.total_price),
    paymentStatus: data.payment_status,
    assignedStaffId: data.assigned_staff_id,
    createdAt: data.created_at
  } });
});

// Catch-All HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server locally (Ignored by Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(` Smart Laundry Web Application is running on Supabase!`);
    console.log(` Web Dashboard URL: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

// Export for Vercel
module.exports = app;
