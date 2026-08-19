/**
 * Smart Laundry - Full Automated API Test Suite
 * Tests: OTP security, Registration, Staff workflow, Login, Orders, Wallet, Admin actions
 *
 * CORRECT API ROUTES (from server.js):
 *   POST /api/auth/send-otp
 *   POST /api/auth/verify-otp
 *   GET  /api/auth/dev-get-otp?email=&purpose=
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/reset-password
 *   GET  /api/users
 *   GET  /api/admin/staff-applications
 *   POST /api/admin/staff-applications/:userId/approve
 *   POST /api/admin/staff-applications/:userId/reject
 *   GET  /api/wallet/:userId
 *   POST /api/wallet/topup   { userId, amount }
 *   GET  /api/orders?userId=
 *   POST /api/orders
 *   PUT  /api/orders/:id/status  { status, staffId }
 */

const http = require('http');

let passed = 0, failed = 0;
const failures = [];

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${name}`);
    console.log(`       → ${err.message}`);
    failures.push({ name, error: err.message });
    failed++;
  }
}

async function getOtp(email, purpose) {
  await request('POST', '/api/auth/send-otp', { email, purpose });
  const r = await request('GET', `/api/auth/dev-get-otp?email=${encodeURIComponent(email)}&purpose=${purpose}`);
  if (r.status === 200 && r.body.otpCode) return r.body.otpCode;
  throw new Error(`OTP fetch failed for ${email}: ${JSON.stringify(r.body)}`);
}

async function runAll() {
  const ts         = Date.now();
  const custEmail  = `testcust_${ts}@example.com`;
  const staffEmail = `teststaff_${ts}@example.com`;
  const rejectEmail= `reject_${ts}@example.com`;
  const custPass   = 'CustPass@123';
  const staffPass  = 'StaffPass@123';
  const adminEmail = 'shaiksuhelbasha609@gmail.com';
  const adminPass  = '123456';
  const tinyPng    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  let custUserId, staffUserId, rejectUserId, orderId;

  // ── 1. SERVER HEALTH ──────────────────────────────────────────────────────
  console.log('\n📋  1. SERVER HEALTH');
  await test('Server is up and responding', async () => {
    const r = await request('GET', '/');
    assert(r.status < 500, `HTTP ${r.status}`);
  });

  // ── 2. OTP SECURITY ────────────────────────────────────────────────────────
  console.log('\n📋  2. OTP EMAIL VERIFICATION (SECURITY)');
  await test('OTP send succeeds and does NOT expose code in response', async () => {
    const r = await request('POST', '/api/auth/send-otp', { email: custEmail, purpose: 'registration' });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
    assert(!r.body.otpCode, '❌ SECURITY VIOLATION: otpCode exposed in API response!');
  });
  await test('OTP send rejects malformed email', async () => {
    const r = await request('POST', '/api/auth/send-otp', { email: 'notvalid', purpose: 'registration' });
    assert(r.status === 400 && r.body.success === false, `Expected 400/fail, got ${r.status}`);
  });
  await test('Forgot-password OTP rejected for unknown email', async () => {
    const r = await request('POST', '/api/auth/send-otp', { email: 'ghost999@nonexist.com', purpose: 'password_reset' });
    assert(r.status === 404 || r.body.success === false, `Expected 404, got ${r.status}`);
  });
  await test('Dev OTP endpoint returns code for testing', async () => {
    const r = await request('GET', `/api/auth/dev-get-otp?email=${encodeURIComponent(custEmail)}&purpose=registration`);
    assert(r.status === 200 && r.body.otpCode, JSON.stringify(r.body));
  });

  // ── 3. CUSTOMER REGISTRATION ──────────────────────────────────────────────
  console.log('\n📋  3. CUSTOMER REGISTRATION');
  let custOtp;
  await test('Get registration OTP for customer', async () => {
    custOtp = await getOtp(custEmail, 'registration');
    assert(custOtp && custOtp.length === 6, `Bad OTP: ${custOtp}`);
  });
  await test('Customer registers with valid OTP', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Test Customer', email: custEmail, password: custPass,
      phone: '9876543210', address: '123 Test St', role: 'customer', otp_code: custOtp
    });
    assert(r.status === 200 || r.status === 201, `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.success === true, JSON.stringify(r.body));
    custUserId = r.body.user?.userId || r.body.user?.user_id;
    assert(custUserId, 'No userId returned');
  });
  await test('Registering same email again is rejected', async () => {
    // OTP used up; new OTP for same email is now for duplicate check
    const otp2 = await getOtp(custEmail, 'registration');
    const r = await request('POST', '/api/auth/register', {
      name: 'Dup', email: custEmail, password: 'x', role: 'customer', otp_code: otp2
    });
    assert(r.status >= 400 && r.body.success === false, `Expected failure, got ${r.status}: ${JSON.stringify(r.body)}`);
  });

  // ── 4. STAFF REGISTRATION ─────────────────────────────────────────────────
  console.log('\n📋  4. STAFF REGISTRATION + VERIFICATION PHOTOS');
  await test('Staff registration without photos is rejected', async () => {
    const tmpOtp = await getOtp(`nophoto_${ts}@test.com`, 'registration');
    const r = await request('POST', '/api/auth/register', {
      name: 'No Photos', email: `nophoto_${ts}@test.com`, password: 'x',
      phone: '9000000000', address: '1 St', role: 'staff', otp_code: tmpOtp
    });
    assert(r.body.success === false, `Expected failure: ${JSON.stringify(r.body)}`);
  });
  let staffOtp;
  await test('Get registration OTP for staff', async () => {
    staffOtp = await getOtp(staffEmail, 'registration');
    assert(staffOtp && staffOtp.length === 6, `Bad OTP: ${staffOtp}`);
  });
  await test('Staff registers with photos + OTP (status=pending)', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Riyan Staff', email: staffEmail, password: staffPass,
      phone: '9111111111', address: '1 Wash St', role: 'staff',
      location_details: 'Central Market', otp_code: staffOtp,
      staff_photo: tinyPng, machines_photo: tinyPng, utilities_photo: tinyPng
    });
    assert(r.status === 200 || r.status === 201, `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.success === true, JSON.stringify(r.body));
    staffUserId = r.body.user?.userId || r.body.user?.user_id;
    assert(staffUserId, 'No staffUserId');
  });
  await test('Pending staff appears in admin users list', async () => {
    const r = await request('GET', '/api/users');
    const list = r.body.users || r.body;
    assert(Array.isArray(list), 'Expected users array');
    const staff = list.find(u => u.email === staffEmail);
    assert(staff, 'Staff not in users list');
    assert(staff.status === 'pending', `Expected pending, got ${staff.status}`);
  });

  // ── 5. LOGIN ──────────────────────────────────────────────────────────────
  console.log('\n📋  5. LOGIN FLOWS');
  await test('Customer login succeeds', async () => {
    const r = await request('POST', '/api/auth/login', { email: custEmail, password: custPass });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
    assert(r.body.user?.role === 'customer', `Role: ${r.body.user?.role}`);
  });
  await test('Pending staff login is blocked', async () => {
    const r = await request('POST', '/api/auth/login', { email: staffEmail, password: staffPass });
    assert(r.status === 403 || r.body.success === false, `Should be blocked: ${JSON.stringify(r.body)}`);
  });
  await test('Admin login succeeds', async () => {
    const r = await request('POST', '/api/auth/login', { email: adminEmail, password: adminPass });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
    assert(r.body.user?.role === 'admin', `Role: ${r.body.user?.role}`);
  });
  await test('Wrong password is rejected', async () => {
    const r = await request('POST', '/api/auth/login', { email: custEmail, password: 'WRONG' });
    assert(r.status === 401 || r.body.success === false, `Expected failure, got ${r.status}`);
  });

  // ── 6. ADMIN: APPROVE STAFF ───────────────────────────────────────────────
  console.log('\n📋  6. ADMIN STAFF APPROVAL');
  await test('Admin approves pending staff (correct route)', async () => {
    assert(staffUserId, 'Need staffUserId');
    const r = await request('POST', `/api/admin/staff-applications/${staffUserId}/approve`, {
      adminEmail, adminPassword: adminPass
    });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
  });
  await test('Approved staff can now log in', async () => {
    const r = await request('POST', '/api/auth/login', { email: staffEmail, password: staffPass });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
    assert(r.body.user?.role === 'staff', `Role: ${r.body.user?.role}`);
  });

  // ── 7. ADMIN: REJECT STAFF ────────────────────────────────────────────────
  console.log('\n📋  7. ADMIN STAFF REJECTION');
  let rejectOtp;
  await test('Get OTP for reject-test staff', async () => {
    rejectOtp = await getOtp(rejectEmail, 'registration');
    assert(rejectOtp && rejectOtp.length === 6, `Bad OTP: ${rejectOtp}`);
  });
  await test('Register staff for rejection test', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Reject Me', email: rejectEmail, password: 'Pass@123',
      phone: '9000000001', address: '2 Reject Rd', role: 'staff',
      location_details: 'Far Zone', otp_code: rejectOtp,
      staff_photo: tinyPng, machines_photo: tinyPng, utilities_photo: tinyPng
    });
    assert(r.body.success === true, JSON.stringify(r.body));
    rejectUserId = r.body.user?.userId || r.body.user?.user_id;
  });
  await test('Admin rejects pending staff (correct route)', async () => {
    assert(rejectUserId, 'Need rejectUserId');
    const r = await request('POST', `/api/admin/staff-applications/${rejectUserId}/reject`, {
      adminEmail, adminPassword: adminPass, reason: 'Incomplete documentation'
    });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
  });
  await test('Rejected staff cannot log in', async () => {
    const r = await request('POST', '/api/auth/login', { email: rejectEmail, password: 'Pass@123' });
    assert(r.status === 403 || r.body.success === false, `Should be blocked: ${JSON.stringify(r.body)}`);
  });

  // ── 8. WALLET ─────────────────────────────────────────────────────────────
  console.log('\n📋  8. WALLET & PAYMENT');
  await test('Customer wallet top-up works', async () => {
    assert(custUserId, 'Need custUserId');
    const r = await request('POST', '/api/wallet/topup', { userId: custUserId, amount: 500 });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
    const bal = r.body.walletBalance ?? r.body.newBalance ?? r.body.balance;
    assert(typeof bal === 'number' && bal >= 500, `Balance: ${JSON.stringify(r.body)}`);
  });
  await test('Wallet balance is retrievable via /api/wallet/:userId', async () => {
    const r = await request('GET', `/api/wallet/${custUserId}`);
    assert(r.status === 200, `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    const bal = r.body.walletBalance ?? r.body.balance;
    assert(typeof bal === 'number', `No balance: ${JSON.stringify(r.body)}`);
    assert(bal >= 500, `Balance ${bal} < 500`);
  });

  // ── 9. ORDER PLACEMENT ────────────────────────────────────────────────────
  console.log('\n📋  9. ORDER PLACEMENT');
  await test('Customer places a laundry order', async () => {
    assert(custUserId, 'Need custUserId');
    const r = await request('POST', '/api/orders', {
      userId: custUserId, serviceType: 'wash_and_fold',
      fabricType: 'cotton', totalQuantity: 2,
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalPrice: 100
    });
    assert(r.status === 200 || r.status === 201, `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.success === true, JSON.stringify(r.body));
    orderId = r.body.order?.orderId || r.body.orderId;
    assert(orderId, 'No orderId returned');
  });
  await test('Order appears in customer order history', async () => {
    const r = await request('GET', `/api/orders?userId=${custUserId}`);
    assert(r.status === 200, `HTTP ${r.status}`);
    const orders = r.body.orders || r.body;
    assert(Array.isArray(orders) && orders.length > 0, 'No orders returned');
    const found = orders.find(o => (o.orderId || o.order_id) === orderId);
    assert(found, `Order ${orderId} not found`);
  });

  // ── 10. STAFF ACCEPTS ORDER ───────────────────────────────────────────────
  console.log('\n📋  10. STAFF ACCEPTS ORDER');
  await test('Staff accepts order via PUT /api/orders/:id/status', async () => {
    assert(orderId && staffUserId, 'Need orderId and staffUserId');
    const r = await request('PUT', `/api/orders/${orderId}/status`, {
      status: 'Accepted', staffId: staffUserId
    });
    assert(r.status === 200 && r.body.success === true, JSON.stringify(r.body));
  });

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const line = '═'.repeat(56);
  console.log('\n' + line);
  console.log(`  TEST RESULTS: ${passed} PASSED  |  ${failed} FAILED  |  ${passed + failed} TOTAL`);
  console.log(line);
  if (failed === 0) {
    console.log('  🎉  ALL TESTS PASSED — System is production ready!\n');
  } else {
    console.log('  ⚠️   Failures:\n');
    failures.forEach(f => console.log(`  ❌ ${f.name}\n     ${f.error}\n`));
  }
  console.log(line + '\n');
}

runAll().catch(err => {
  console.error('\n💥 Test runner error:', err.message);
  process.exit(1);
});
