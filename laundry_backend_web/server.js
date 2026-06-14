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
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in Supabase
  const { error } = await supabase
    .from('otps')
    .insert([{
      email,
      otp_code: otpCode,
      purpose: purpose || 'general',
      created_at: Date.now(),
      expires_at: expiresAt,
      is_used: false
    }]);

  if (error) {
    return res.status(500).json({ success: false, message: "Database error storing OTP. Make sure the otps table exists." });
  }

  // Send Email
  try {
    const mailOptions = {
      from: '"Smart Laundry" <shaiksuhelbasha609@gmail.com>',
      to: email,
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
  
  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
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

  // Mark as used
  await supabase.from('otps').update({ is_used: true }).eq('id', data.id);

  res.json({ success: true, message: "OTP verified successfully" });
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, new_password, otp_code } = req.body;

  // Verify OTP again just to be safe
  const { data: otpData, error: otpError } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otp_code)
    .eq('purpose', 'password_reset')
    .eq('is_used', true) // It should have been marked used by verify-otp, or we can check unused and mark it here
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Or alternatively, just allow if they verified it recently. Let's just do a direct update if they provide the OTP in one shot.
  // Actually, let's allow it if the OTP is valid and unused
  const { data: validOtp } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otp_code)
    .eq('purpose', 'password_reset')
    .eq('is_used', false)
    .gte('expires_at', Date.now())
    .single();

  if (!validOtp) {
     return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  // Mark used
  await supabase.from('otps').update({ is_used: true }).eq('id', validOtp.id);

  // Update User password
  const { data, error } = await supabase
    .from('users')
    .update({ password: new_password })
    .eq('email', email)
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

// Auth: Register (Now requires verification)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address, role, otp_code } = req.body;
  
  // Verify OTP
  const { data: validOtp } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otp_code)
    .eq('purpose', 'registration')
    .eq('is_used', false)
    .gte('expires_at', Date.now())
    .single();

  if (!validOtp) {
    return res.status(400).json({ success: false, message: "Email verification failed. Invalid or expired OTP." });
  }

  // Mark OTP used
  await supabase.from('otps').update({ is_used: true }).eq('id', validOtp.id);

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
