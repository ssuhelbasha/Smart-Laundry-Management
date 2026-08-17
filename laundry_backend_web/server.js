const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
global.WebSocket = require('ws'); // Polyfill for Node 20

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'mock_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Nodemailer Configuration (Using User Provided SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'shaiksuhelbasha609@gmail.com',
    pass: process.env.SMTP_PASS || 'wnxk xszg qlid onps'
  }
});

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- OTP / EMAIL ENDPOINTS ---

// 1. Send OTP (For Registration or Forgot Password)
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, purpose } = req.body;
  const lowerEmail = email ? email.toLowerCase() : '';
  
  if (!lowerEmail || !lowerEmail.includes('@')) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const { error } = await supabase
    .from('otps')
    .insert([{
      email: lowerEmail,
      otp_code: otpCode,
      purpose: purpose || 'general',
      created_at: Date.now(),
      expires_at: expiresAt,
      is_used: false
    }]);

  if (error) {
    return res.status(500).json({ success: false, message: "Database error storing OTP. Make sure the otps table exists." });
  }

  try {
    const mailOptions = {
      from: '"Smart Laundry" <shaiksuhelbasha609@gmail.com>',
      to: lowerEmail,
      subject: purpose === 'password_reset' ? 'Password Reset Code' : 'Your Verification Code',
      text: `Your Smart Laundry verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.`
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp_code, purpose } = req.body;
  const lowerEmail = email ? email.toLowerCase() : '';
  
  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('email', lowerEmail)
    .eq('otp_code', otp_code)
    .eq('purpose', purpose || 'general')
    .eq('is_used', false)
    .gte('expires_at', Date.now())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  await supabase.from('otps').update({ is_used: true }).eq('id', data.id);
  res.json({ success: true, message: "OTP verified successfully" });
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, new_password, otp_code } = req.body;
  const lowerEmail = email ? email.toLowerCase() : '';

  const { data: validOtp } = await supabase
    .from('otps')
    .select('*')
    .eq('email', lowerEmail)
    .eq('otp_code', otp_code)
    .eq('purpose', 'password_reset')
    .eq('is_used', false)
    .gte('expires_at', Date.now())
    .single();

  if (!validOtp) {
     return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  await supabase.from('otps').update({ is_used: true }).eq('id', validOtp.id);

  const { data, error } = await supabase
    .from('users')
    .update({ password: new_password })
    .eq('email', lowerEmail)
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({ success: false, message: "Failed to reset password. User might not exist." });
  }

  res.json({ success: true, message: "Password updated successfully" });
});

// --- REST API ENDPOINTS ---

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const lowerEmail = email ? email.toLowerCase() : '';
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', lowerEmail)
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
    role: data.role,
    walletBalance: parseFloat(data.wallet_balance || 0)
  }});
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address, role, otp_code } = req.body;
  const lowerEmail = email ? email.toLowerCase() : '';
  
  const { data: validOtp } = await supabase
    .from('otps')
    .select('*')
    .eq('email', lowerEmail)
    .eq('otp_code', otp_code)
    .eq('purpose', 'registration')
    .eq('is_used', false)
    .gte('expires_at', Date.now())
    .single();

  if (!validOtp) {
    return res.status(400).json({ success: false, message: "Email verification failed. Invalid or expired OTP." });
  }

  await supabase.from('otps').update({ is_used: true }).eq('id', validOtp.id);

  const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ 
      user_id: userId, 
      name, 
      email: lowerEmail, 
      password, 
      phone, 
      address, 
      role: role || 'customer',
      wallet_balance: 0.00
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
    role: data.role,
    walletBalance: parseFloat(data.wallet_balance || 0)
  }});
});

// Get Users (Admin)
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, name, email, phone, address, role, wallet_balance');

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
  
  const mappedUsers = data.map(u => ({
    userId: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    role: u.role,
    walletBalance: parseFloat(u.wallet_balance || 0)
  }));
  res.json(mappedUsers);
});

// --- WALLET ENDPOINTS ---

// Get Wallet Balance
app.get('/api/wallet/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('user_id', req.params.userId)
    .single();
    
  if (error || !data) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, walletBalance: parseFloat(data.wallet_balance || 0) });
});

// Top-Up Wallet
app.post('/api/wallet/topup', async (req, res) => {
  const { userId, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

  const { data: user, error: uErr } = await supabase.from('users').select('wallet_balance').eq('user_id', userId).single();
  if (uErr || !user) return res.status(404).json({ success: false, message: "User not found" });
  const newBalance = parseFloat(user.wallet_balance || 0) + parseFloat(amount);

  const { data, error } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('user_id', userId).select().single();
  
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, walletBalance: parseFloat(data.wallet_balance) });
});

// Transfer Wallet (Admin to Staff)
app.post('/api/wallet/transfer', async (req, res) => {
  const { adminId, staffId, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

  const { data: admin, error: aErr } = await supabase.from('users').select('wallet_balance').eq('user_id', adminId).single();
  if (aErr || !admin) return res.status(404).json({ success: false, message: "Admin user not found" });
  const adminBalance = parseFloat(admin.wallet_balance || 0);

  if (adminBalance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient admin wallet balance" });
  }

  const { data: staff, error: sErr } = await supabase.from('users').select('wallet_balance').eq('user_id', staffId).single();
  if (sErr || !staff) return res.status(404).json({ success: false, message: "Staff user not found" });
  
  // Deduct from admin
  await supabase.from('users').update({ wallet_balance: adminBalance - amount }).eq('user_id', adminId);
  
  // Add to staff
  const newStaffBalance = parseFloat(staff.wallet_balance || 0) + parseFloat(amount);
  const { data } = await supabase.from('users').update({ wallet_balance: newStaffBalance }).eq('user_id', staffId).select().single();

  res.json({ success: true, message: "Transferred successfully", newAdminBalance: adminBalance - amount });
});

// Get Pricing
app.get('/api/pricing', async (req, res) => {
  const { data, error } = await supabase
    .from('pricing')
    .select('base_price')
    .limit(1)
    .single();

  if (error || !data) {
    return res.json({ basePrice: 2.00 });
  }
  res.json({ basePrice: parseFloat(data.base_price) });
});

app.put('/api/pricing', async (req, res) => {
  const { basePrice } = req.body;
  if (typeof basePrice !== 'number' || basePrice <= 0) {
    return res.status(400).json({ success: false, message: "Invalid base price value" });
  }
  
  const { data, error } = await supabase
    .from('pricing')
    .update({ base_price: basePrice })
    .eq('id', 1)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, pricing: { basePrice: parseFloat(data.base_price) } });
});

// Get Orders
app.get('/api/orders', async (req, res) => {
  const { userId, staffId } = req.query;
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (staffId) {
    query = query.or(`assigned_staff_id.eq.${staffId},status.eq.Pending,assigned_staff_id.is.null`);
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

// Create Order (Deducts Wallet)
app.post('/api/orders', async (req, res) => {
  const { userId, serviceType, fabricType, totalQuantity, pickupDate, totalPrice } = req.body;
  const cost = parseFloat(totalPrice) || 0.00;

  // Wallet Check
  const { data: user, error: userError } = await supabase.from('users').select('wallet_balance').eq('user_id', userId).single();
  if (userError || !user) {
    return res.status(400).json({ success: false, message: "User not found or invalid user ID" });
  }
  const balance = parseFloat(user.wallet_balance || 0);

  if (balance < cost) {
    return res.status(400).json({ success: false, message: "Insufficient wallet balance. Please add funds." });
  }

  // Deduct Wallet
  await supabase.from('users').update({ wallet_balance: balance - cost }).eq('user_id', userId);
  
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
      status: "Pending",
      total_price: cost,
      payment_status: "Paid", // Paid via Wallet
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
  }, newBalance: balance - cost });
});

// Update Order Status (Escrow payout on Delivered)
app.put('/api/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status, staffId } = req.body;
  
  let updateData = {};
  if (status) updateData.status = status;
  if (staffId) updateData.assigned_staff_id = staffId;
  
  // If Rejected, refund the user
  if (status === "Rejected") {
    const { data: order } = await supabase.from('orders').select('*').eq('order_id', orderId).single();
    if (order && order.payment_status === "Paid") {
      const { data: user } = await supabase.from('users').select('wallet_balance').eq('user_id', order.user_id).single();
      await supabase.from('users').update({ wallet_balance: parseFloat(user.wallet_balance || 0) + parseFloat(order.total_price) }).eq('user_id', order.user_id);
      updateData.payment_status = "Refunded";
      updateData.assigned_staff_id = null; // Unassign staff if rejected
    }
  }

  // If Delivered, Escrow payout to Admin
  if (status === "Delivered") {
    const { data: order } = await supabase.from('orders').select('*').eq('order_id', orderId).single();
    if (order && order.payment_status === "Paid") {
      // Find Admin
      const { data: admins } = await supabase.from('users').select('*').eq('role', 'admin').limit(1);
      if (admins && admins.length > 0) {
         const admin = admins[0];
         await supabase.from('users').update({ wallet_balance: parseFloat(admin.wallet_balance || 0) + parseFloat(order.total_price) }).eq('user_id', admin.user_id);
      }
    }
  }

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

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(` Smart Laundry Web Application is running on Supabase!`);
    console.log(` Web Dashboard URL: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

module.exports = app;
