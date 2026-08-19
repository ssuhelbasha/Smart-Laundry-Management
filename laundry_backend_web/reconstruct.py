import os

def reconstruct_server():
    raw_path = r'C:\Users\Lenovo\.gemini\antigravity\scratch\SmartLaundryManagement\laundry_backend_web\recovered_server_raw.txt'
    with open(raw_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip the line numbers! The lines have format: '1: const express...'
    clean_lines = []
    for line in content.split('\n'):
        if ': ' in line and line.split(': ')[0].isdigit():
            clean_lines.append(line.split(': ', 1)[1])
        elif line.startswith('The following code'):
            continue
        elif line.startswith('File Path:'):
            continue
        elif line.startswith('Total Lines:'):
            continue
        elif line.startswith('Total Bytes:'):
            continue
        elif line.startswith('Showing lines'):
            continue
        else:
            clean_lines.append(line)
            
    # The last clean line is '    `,'
    # We append the rest of the reject endpoint:
    clean_lines.append("    text: `Your Smart Laundry application was rejected.\\n\\nReason: ${rejectionReason}`")
    clean_lines.append("  };")
    clean_lines.append("  sendEmail(mailOptions).catch(e => console.error(\"Staff rejection mail error:\", e.message));")
    clean_lines.append("")
    clean_lines.append("  res.json({ success: true, message: `Staff application for ${targetUser.name} has been rejected.` });")
    clean_lines.append("});")
    
    # Now append the remaining endpoints from main branch's server.js, but with localDb fallback!
    rest = """
// --- WALLET ENDPOINTS ---

app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  const localDb = readLocalDb();
  let walletBalance = 0;
  
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('users').select('wallet_balance').eq('user_id', userId).single();
    if (data) walletBalance = parseFloat(data.wallet_balance || 0);
  } else {
    const user = localDb.users?.find(u => u.userId === userId || u.user_id === userId);
    if (user) walletBalance = parseFloat(user.walletBalance || user.wallet_balance || 0);
  }
  
  res.json({ success: true, walletBalance });
});

app.post('/api/wallet/topup', async (req, res) => {
  const { userId, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

  const localDb = readLocalDb();
  const userIdx = localDb.users?.findIndex(u => u.userId === userId || u.user_id === userId);
  let newBalance = 0;

  if (userIdx !== -1 && localDb.users) {
    newBalance = parseFloat(localDb.users[userIdx].walletBalance || localDb.users[userIdx].wallet_balance || 0) + parseFloat(amount);
    localDb.users[userIdx].walletBalance = newBalance;
    writeLocalDb(localDb);
  }

  if (isSupabaseConfigured && supabase) {
    const { data: user } = await supabase.from('users').select('wallet_balance').eq('user_id', userId).single();
    if (user) {
      newBalance = parseFloat(user.wallet_balance || 0) + parseFloat(amount);
      await supabase.from('users').update({ wallet_balance: newBalance }).eq('user_id', userId);
    }
  }

  res.json({ success: true, walletBalance: newBalance });
});

app.post('/api/wallet/transfer', async (req, res) => {
  const { adminId, staffId, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

  const localDb = readLocalDb();
  const adminIdx = localDb.users?.findIndex(u => u.userId === adminId || u.user_id === adminId);
  const staffIdx = localDb.users?.findIndex(u => u.userId === staffId || u.user_id === staffId);

  let newAdminBalance = 0;
  if (adminIdx !== -1 && staffIdx !== -1 && localDb.users) {
    const adminBalance = parseFloat(localDb.users[adminIdx].walletBalance || localDb.users[adminIdx].wallet_balance || 0);
    if (adminBalance < amount) return res.status(400).json({ success: false, message: "Insufficient admin wallet balance" });
    
    newAdminBalance = adminBalance - amount;
    localDb.users[adminIdx].walletBalance = newAdminBalance;
    localDb.users[staffIdx].walletBalance = parseFloat(localDb.users[staffIdx].walletBalance || localDb.users[staffIdx].wallet_balance || 0) + parseFloat(amount);
    writeLocalDb(localDb);
  }

  if (isSupabaseConfigured && supabase) {
    const { data: admin } = await supabase.from('users').select('wallet_balance').eq('user_id', adminId).single();
    if (admin) {
        const adminBal = parseFloat(admin.wallet_balance || 0);
        if (adminBal >= amount) {
            newAdminBalance = adminBal - amount;
            await supabase.from('users').update({ wallet_balance: newAdminBalance }).eq('user_id', adminId);
            const { data: staff } = await supabase.from('users').select('wallet_balance').eq('user_id', staffId).single();
            if (staff) {
                const staffBal = parseFloat(staff.wallet_balance || 0);
                await supabase.from('users').update({ wallet_balance: staffBal + amount }).eq('user_id', staffId);
            }
        }
    }
  }

  res.json({ success: true, message: "Transferred successfully", newAdminBalance });
});

app.get('/api/pricing', async (req, res) => {
  const localDb = readLocalDb();
  let basePrice = localDb.pricing?.basePrice || 2.00;
  
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('pricing').select('base_price').limit(1).single();
    if (data) basePrice = parseFloat(data.base_price);
  }
  
  res.json({ basePrice });
});

app.put('/api/pricing', async (req, res) => {
  const { basePrice } = req.body;
  if (typeof basePrice !== 'number' || basePrice <= 0) return res.status(400).json({ success: false, message: "Invalid base price value" });
  
  const localDb = readLocalDb();
  localDb.pricing = { basePrice };
  writeLocalDb(localDb);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('pricing').update({ base_price: basePrice }).eq('id', 1);
  }
  
  res.json({ success: true, pricing: { basePrice } });
});

app.get('/api/orders', async (req, res) => {
  const { userId, staffId } = req.query;
  const localDb = readLocalDb();
  let orders = localDb.orders || [];

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    else if (staffId) query = query.or(`assigned_staff_id.eq.${staffId},status.eq.Pending,assigned_staff_id.is.null`);
    const { data } = await query;
    if (data) {
        orders = data.map(o => ({
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
    }
  }

  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { userId, serviceType, fabricType, totalQuantity, pickupDate, totalPrice } = req.body;
  const cost = parseFloat(totalPrice) || 0.00;
  
  const localDb = readLocalDb();
  const userIdx = localDb.users?.findIndex(u => u.userId === userId || u.user_id === userId);
  
  if (userIdx !== -1 && localDb.users) {
      const balance = parseFloat(localDb.users[userIdx].walletBalance || localDb.users[userIdx].wallet_balance || 0);
      if (balance < cost) return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
      localDb.users[userIdx].walletBalance = balance - cost;
  }

  const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
  const order = {
      orderId,
      userId,
      serviceType,
      fabricType,
      totalQuantity: parseInt(totalQuantity) || 1,
      pickupDate,
      status: "Pending",
      totalPrice: cost,
      paymentStatus: "Paid",
      assignedStaffId: null,
      createdAt: Date.now()
  };

  if (!localDb.orders) localDb.orders = [];
  localDb.orders.push(order);
  writeLocalDb(localDb);

  if (isSupabaseConfigured && supabase) {
      await supabase.from('orders').insert([{
          order_id: orderId,
          user_id: userId,
          service_type: serviceType,
          fabric_type: fabricType,
          total_quantity: parseInt(totalQuantity) || 1,
          pickup_date: pickupDate,
          status: "Pending",
          total_price: cost,
          payment_status: "Paid",
          assigned_staff_id: null,
          created_at: Date.now()
      }]);
  }

  res.json({ success: true, order });
});

app.put('/api/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status, staffId } = req.body;
  
  const localDb = readLocalDb();
  const orderIdx = localDb.orders?.findIndex(o => o.orderId === orderId || o.order_id === orderId);
  let order = null;

  if (orderIdx !== -1 && localDb.orders) {
      if (status) localDb.orders[orderIdx].status = status;
      if (staffId) localDb.orders[orderIdx].assignedStaffId = staffId;
      order = localDb.orders[orderIdx];
      
      if (status === "Rejected" && order.paymentStatus === "Paid") {
          const userIdx = localDb.users?.findIndex(u => u.userId === order.userId || u.user_id === order.userId);
          if (userIdx !== -1) {
              localDb.users[userIdx].walletBalance = parseFloat(localDb.users[userIdx].walletBalance || 0) + parseFloat(order.totalPrice);
          }
          localDb.orders[orderIdx].paymentStatus = "Refunded";
          localDb.orders[orderIdx].assignedStaffId = null;
      }
      
      if (status === "Delivered" && order.paymentStatus === "Paid") {
          const adminIdx = localDb.users?.findIndex(u => u.role === 'admin');
          if (adminIdx !== -1) {
              localDb.users[adminIdx].walletBalance = parseFloat(localDb.users[adminIdx].walletBalance || 0) + parseFloat(order.totalPrice);
          }
      }
      writeLocalDb(localDb);
  }

  if (isSupabaseConfigured && supabase) {
      let updateData = {};
      if (status) updateData.status = status;
      if (staffId) updateData.assigned_staff_id = staffId;
      await supabase.from('orders').update(updateData).eq('order_id', orderId);
  }

  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, order });
});

// Catch-All HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(` Smart Laundry Web Application Server Running`);
    console.log(` Web Dashboard URL: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

module.exports = app;
"""
    clean_lines.append(rest)
    
    with open(r'C:\Users\Lenovo\.gemini\antigravity\scratch\SmartLaundryManagement\laundry_backend_web\server.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(clean_lines).replace('\n\n\n', '\n\n'))

reconstruct_server()
