const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Local JSON Database path
const DB_FILE = path.join(__dirname, 'db.json');

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Standard In-Memory Database structure
let dbState = {
  users: [
    // Pre-seeded role profiles for instant testing
    { userId: "usr_cust1", name: "Jane Customer", email: "customer@laundry.com", password: "123", phone: "9876543210", address: "123 Clean Street, Bubble Town", role: "customer" },
    { userId: "usr_staff1", name: "Bob Staff", email: "staff@laundry.com", password: "123", phone: "9876543211", address: "Laundry Depot Hub 4", role: "staff" },
    { userId: "usr_admin1", name: "Manager Admin", email: "admin@laundry.com", password: "123", phone: "9876543212", address: "Central Administration Office", role: "admin" }
  ],
  orders: [
    {
      orderId: "ord_1",
      userId: "usr_cust1",
      serviceType: "Dry Cleaning",
      fabricType: "Silk Saree",
      totalQuantity: 3,
      pickupDate: "2026-06-03",
      status: "Washing",
      totalPrice: 9.00,
      paymentStatus: "Pending",
      assignedStaffId: "usr_staff1",
      createdAt: Date.now() - 3600000 // 1 hour ago
    }
  ],
  pricing: {
    basePrice: 2.00
  }
};

// Load database state from disk if it exists
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
      console.log('Database state loaded successfully from disk.');
    } else {
      saveDatabase();
    }
  } catch (e) {
    console.error('Error loading db.json, using defaults:', e.message);
  }
}

// Save database state to disk
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save dbState to disk:', e.message);
  }
}

// Initial DB Load
loadDatabase();

// --- REST API ENDPOINTS ---

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = dbState.users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  if (dbState.users.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Email is already registered" });
  }
  const newUser = {
    userId: 'usr_' + Math.random().toString(36).substr(2, 9),
    name,
    email,
    password,
    phone,
    address,
    role: role || "customer"
  };
  dbState.users.push(newUser);
  saveDatabase();
  res.json({ success: true, user: newUser });
});

// Get Users (Admin only conceptually, though we just expose it here)
app.get('/api/users', (req, res) => {
  // Omit passwords for security
  const safeUsers = dbState.users.map(u => ({
    userId: u.userId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    role: u.role
  }));
  res.json(safeUsers);
});

// Get Pricing
app.get('/api/pricing', (req, res) => {
  res.json(dbState.pricing);
});

// Update Pricing (Admin)
app.put('/api/pricing', (req, res) => {
  const { basePrice } = req.body;
  if (typeof basePrice !== 'number' || basePrice <= 0) {
    return res.status(400).json({ success: false, message: "Invalid base price value" });
  }
  dbState.pricing.basePrice = basePrice;
  saveDatabase();
  res.json({ success: true, pricing: dbState.pricing });
});

// Get Orders (with role queries)
app.get('/api/orders', (req, res) => {
  const { userId, staffId } = req.query;
  let list = dbState.orders;
  if (userId) {
    list = list.filter(o => o.userId === userId);
  } else if (staffId) {
    list = list.filter(o => o.assignedStaffId === staffId || o.status === "Pickup Pending" || !o.assignedStaffId);
  }
  res.json(list);
});

// Create Order
app.post('/api/orders', (req, res) => {
  const { userId, serviceType, fabricType, totalQuantity, pickupDate, totalPrice } = req.body;
  const newOrder = {
    orderId: 'ord_' + Math.random().toString(36).substr(2, 9),
    userId,
    serviceType,
    fabricType,
    totalQuantity: parseInt(totalQuantity) || 1,
    pickupDate,
    status: "Pickup Pending",
    totalPrice: parseFloat(totalPrice) || 0.00,
    paymentStatus: "Pending",
    assignedStaffId: "",
    createdAt: Date.now()
  };
  dbState.orders.unshift(newOrder); // Add to beginning
  saveDatabase();
  res.json({ success: true, order: newOrder });
});

// Update Order Status (Staff / Admin / QR Verification)
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status, staffId } = req.body;
  const order = dbState.orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  
  if (status) order.status = status;
  if (staffId) order.assignedStaffId = staffId;
  
  // Auto-complete payment on delivery drop-off
  if (status === "Delivered") {
    order.paymentStatus = "Paid";
  }
  
  saveDatabase();
  res.json({ success: true, order });
});

// Catch-All HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(` Smart Laundry Web Application is running!`);
  console.log(` Web Dashboard URL: http://localhost:${PORT}`);
  console.log(` Pre-seeded accounts for testing:`);
  console.log(`   🔑 Customer: customer@laundry.com (password: 123)`);
  console.log(`   🔑 Staff:    staff@laundry.com    (password: 123)`);
  console.log(`   🔑 Admin:    admin@laundry.com    (password: 123)`);
  console.log(`===================================================`);
});
