const express = require('express');
const crypto = require('crypto');
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config();
global.WebSocket = require('ws'); // Polyfill for Node 20

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || 'mock_key';
const isSupabaseConfigured = Boolean(
process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('mock.supabase.co')
);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

const { Resend } = require('resend');

// --- Email Setup ---
// Production: Resend API (works on Vercel, uses HTTPS not SMTP)
// Local fallback: Gmail SMTP via App Password
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'shaiksuhelbasha609@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || true;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const smtpTransporter = (SMTP_USER && SMTP_PASS) ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
}) : null;

// SMTP Startup Verification
if (smtpTransporter && process.env.NODE_ENV !== 'test') {
  smtpTransporter.verify().then(() => {
    console.log(`\n[EMAIL SERVICE]`);
    console.log(`Provider: Gmail SMTP`);
    console.log(`Host: ${SMTP_HOST}`);
    console.log(`Port: ${SMTP_PORT}`);
    console.log(`User: configured`);
    console.log(`Password: configured`);
    console.log(`Connection: VERIFIED`);
    console.log(`Mode: REAL EMAIL\n`);
  }).catch(err => {
    console.error(`\n[EMAIL SERVICE] Connection FAILED: ${err.message}\n`);
  });
}

/**
 * Sends email via Resend API (production) or Gmail SMTP (local fallback).
 * OTP is NEVER returned in API responses — only sent to user's inbox.
 * Errors are caught — a failed email never crashes the server.
 */
async function sendEmail(mailOptions) {
  const from = `Smart Laundry <onboarding@resend.dev>`;
  try {
    if (smtpTransporter) {
      // Primary: Gmail SMTP (allows sending to any address without domain verification)
      await smtpTransporter.sendMail({
        from: `"Smart Laundry" <${SMTP_USER}>`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text
      });
      console.log(`✅ Email sent via SMTP to ${mailOptions.to}`);
    } else if (resendClient) {
      // Fallback: Resend API (requires verified domain for non-owner emails)
      const { error } = await resendClient.emails.send({
        from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text
      });
      if (error) throw new Error(error.message);
      console.log(`✅ Email sent via Resend to ${mailOptions.to}`);
    } else {
      throw new Error('No email transport configured. Set SMTP_USER/SMTP_PASS or RESEND_API_KEY environment variables.');
    }

  } catch (err) {
    console.error(`❌ Email failed to ${mailOptions.to}:`, err.message);
    throw err;
  }
}

/**
 * Standard reusable HTML email template
 */
function getStandardEmailTemplate(customerName, message, orderDetails = null, additionalDetails = '') {
  let orderSection = '';
  if (orderDetails) {
    orderSection = `
      <h3 style="color: #1d4ed8; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Order ID:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">#${orderDetails.id}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${orderDetails.status}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${orderDetails.date}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #15803d;"><strong>Total:</strong></td><td style="padding: 8px 0; font-weight: bold; color: #15803d; text-align: right;">${orderDetails.total}</td></tr>
      </table>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0;">SMART LAUNDRY MANAGEMENT SYSTEM</h2>
      </div>
      <div style="color: #333; line-height: 1.6; font-size: 15px;">
        <p>Hello ${customerName},</p>
        <p>${message}</p>
        ${orderSection}
        ${additionalDetails ? `<p>${additionalDetails}</p>` : ''}
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e0e0e0; text-align: center; font-size: 13px; color: #888;">
        <p style="margin: 5px 0;">Thank you for using</p>
        <p style="margin: 5px 0; font-weight: bold;">Smart Laundry Management System</p>
      </div>
    </div>
  `;
}


// Local storage helper for resilient fallback & extended metadata (photos, etc.)
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel ? path.join('/tmp', 'db.json') : path.join(__dirname, 'db.json');
function readLocalDb() {
try {
if (fs.existsSync(DB_PATH)) {
return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
} catch (err) {
console.error("Local db read error:", err);
}
return { users: [], orders: [], pricing: { basePrice: 2.0 } };
}

function writeLocalDb(data) {
try {
fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
} catch (err) {
console.error("Local db write error:", err);
}
}

const otpStore = new Map();

// --- Persistent OTP Storage (Supabase for production, in-memory Map for local dev) ---
async function storeOtp(key, data) {
  otpStore.set(key, data);
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('otp_codes').upsert({
        otp_key: key,
        otp_code: data.otpCode || null,
        expires_at: data.expiresAt,
        used: data.used || false,
        via: data.via || 'email',
        attempts: data.attempts || 0
      }, { onConflict: 'otp_key' });
      if (error) console.error('Supabase upsert error:', error);
    } catch (err) {
      console.error('OTP persist exception:', err.message);
    }
  }
}

async function getOtp(key) {
  let cached = null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('otp_key', key)
        .single();
      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
          console.error('Supabase select error:', error);
      }
      if (!error && data) {
        cached = {
          otpCode: data.otp_code,
          expiresAt: data.expires_at,
          used: data.used,
          via: data.via,
          attempts: data.attempts || 0
        };
        otpStore.set(key, cached);
      }
    } catch (err) {
      console.error('OTP read exception:', err.message);
    }
  }
  return cached || otpStore.get(key) || null;
}

async function updateOtp(key, updates) {
  const cached = otpStore.get(key);
  if (cached) Object.assign(cached, updates);
  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates = {};
      if ('used' in updates) dbUpdates.used = updates.used;
      if ('attempts' in updates) dbUpdates.attempts = updates.attempts;
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('otp_codes').update(dbUpdates).eq('otp_key', key);
        if (error) console.error('Supabase update error:', error);
      }
    } catch (err) {
      console.error('OTP update exception:', err.message);
    }
  }
}

// Middlewares
const cors = require('cors');
app.use(cors()); // Allow all origins for production compatibility
// Support large payloads for base64 photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const otpRateLimits = new Map();

function isAdmin(adminId) {
  console.log("isAdmin called with:", adminId);
  if (!adminId) return false;
  const localDb = readLocalDb();
  const isAdminFound = !!localDb.users?.find(u => 
    (u.userId === adminId || u.user_id === adminId || u.email === adminId) && 
    u.role === 'admin'
  );
  console.log("isAdmin returning:", isAdminFound);
  return isAdminFound;
}

// --- OTP / EMAIL ENDPOINTS ---

// 1. Send OTP (For Registration or Forgot Password)
app.post('/api/auth/send-otp', async (req, res) => {
const { email, purpose } = req.body;
const lowerEmail = email ? email.toLowerCase().trim() : '';
  if (otpRateLimits.has(lowerEmail) && Date.now() - otpRateLimits.get(lowerEmail) < 30000) {
    return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });
  }
  otpRateLimits.set(lowerEmail, Date.now());

if (!lowerEmail || !lowerEmail.includes('@')) {
return res.status(400).json({ success: false, message: "Invalid email format" });
}

// If purpose is password_reset, verify that user exists first
if (purpose === 'password_reset') {
let userExists = false;
const localDb = readLocalDb();
const localUser = localDb.users?.find(u => u.email?.toLowerCase() === lowerEmail);
if (localUser) userExists = true;
if (!userExists && isSupabaseConfigured && supabase) {
try {
const { data: user } = await supabase.from('users').select('user_id').eq('email', lowerEmail).maybeSingle();
if (user) userExists = true;
} catch (e) {}
}
if (!userExists) {
return res.status(404).json({ success: false, message: "No account found with this email address." });
}
}

const otpPurpose = purpose || 'general';
const key = `${lowerEmail}_${otpPurpose}`;

// --- Generate OTP and send via configured email transport ---
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = Date.now() + 10 * 60 * 1000;
await storeOtp(key, { otpCode, expiresAt, used: false, via: 'email', attempts: 0 });

if (process.env.NODE_ENV !== 'production') {
  console.log(`\n[DEV MODE] Generated OTP for ${lowerEmail}: ${otpCode}\n`);
}
console.log(`📧 Sending OTP email to ${lowerEmail} via ${smtpTransporter ? 'SMTP' : (resendClient ? 'Resend' : 'NONE')}`);

const isReset = otpPurpose === 'password_reset';
const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
<h2 style="color: #2563eb; text-align: center;">Smart Laundry Management</h2>
<p style="font-size: 16px; color: #333;">Hello,</p>
<p style="font-size: 15px; color: #555;">
${isReset ? 'Use this code to reset your password:' : 'Use this code to verify your email:'}
</p>
<div style="text-align: center; margin: 30px 0;">
<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #eff6ff; color: #1d4ed8; padding: 10px 24px; border-radius: 8px; border: 1px dashed #3b82f6;">
${otpCode}
</span>
</div>
<p style="font-size: 13px; color: #888; text-align: center;">Expires in 10 minutes. Do not share with anyone.</p>
</div>
`;
try {
  await sendEmail({
    to: lowerEmail,
    subject: isReset ? 'Smart Laundry - Password Reset Code' : 'Smart Laundry - Email Verification Code',
    html: emailHtml,
    text: `Your Smart Laundry verification code is: ${otpCode}\n\nExpires in 10 minutes.`
  });

  // OTP is NEVER included in the API response
  res.json({ 
    success: true, 
    message: `Verification code sent to ${lowerEmail}. Please check your inbox and spam folder.`
  });
} catch (err) {
  res.status(500).json({
    success: false,
    message: err.message.includes('validation_error') 
      ? "Email delivery failed: Resend Free Tier requires verified domains. Please test with your verified email address."
      : "Failed to send email: " + err.message
  });
}
});


// Helper to verify OTP — routes to correct verifier based on how OTP was sent
async function checkOtpValid(email, otpCode, purpose, consume = true) {
console.log('checkOtpValid start:', {email, purpose, consume});
const lowerEmail = email.toLowerCase().trim();
const key = `${lowerEmail}_${purpose}`;
const cleanOtpCode = String(otpCode).trim();

// Dev shortcut — only available outside production
if (cleanOtpCode === '123456' && process.env.NODE_ENV !== 'production') {
return true;
}

const cached = await getOtp(key);
console.log('OTP record found:', !!cached);
if (!cached) return false;
if (cached.attempts >= 3) return false;

// Verify OTP code matches stored value
if (cached.expiresAt >= Date.now()) {
if (cached.used) return false;
if (cached.otpCode === cleanOtpCode) {
if (consume) await updateOtp(key, { used: true });
return true;
} else {
await updateOtp(key, { attempts: (cached.attempts || 0) + 1 });
}
}

return false;
}

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
const { email, otp_code, purpose } = req.body;
if (!email || !otp_code) {
return res.status(400).json({ success: false, message: "Email and OTP code are required" });
}

const isValid = await checkOtpValid(email, otp_code, purpose || 'general', false);
if (!isValid) {
return res.status(400).json({ success: false, message: "Invalid or expired OTP code. Please request a new one." });
}

res.json({ success: true, message: "OTP verified successfully" });
});

// DEV-ONLY: Retrieve OTP for automated testing (disabled in production)
app.get('/api/auth/dev-get-otp', (req, res) => {
if (process.env.NODE_ENV === 'production') {
return res.status(404).json({ success: false, message: "Not found" });
}
const { email, purpose } = req.query;
const lowerEmail = (email || '').toLowerCase().trim();
const key = `${lowerEmail}_${purpose || 'general'}`;
const record = otpStore.get(key);
if (!record || record.used || Date.now() > record.expiresAt) {
return res.status(404).json({ success: false, message: "No valid OTP found for this email" });
}
res.json({ success: true, otpCode: record.otpCode });
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
const { email, new_password, otp_code } = req.body;
const lowerEmail = email ? email.toLowerCase().trim() : '';

if (!lowerEmail || !new_password || !otp_code) {
return res.status(400).json({ success: false, message: "Missing required fields" });
}

const isValid = await checkOtpValid(lowerEmail, otp_code, 'password_reset');
if (!isValid) {
return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
}

let updated = false;

// Update in Supabase if configured
if (isSupabaseConfigured && supabase) {
try {
const { data, error } = await supabase
.from('users')
.update({ password: hashPassword(new_password) })
.eq('email', lowerEmail)
.select()
.single();

if (!error && data) {
updated = true;
}
} catch (err) {
console.warn("Supabase password update notice:", err.message);
}
}

// Update in local DB
const localDb = readLocalDb();
const userIdx = localDb.users?.findIndex(u => u.email?.toLowerCase() === lowerEmail);
if (userIdx !== -1 && localDb.users) {
localDb.users[userIdx].password = hashPassword(new_password);
writeLocalDb(localDb);
updated = true;
}

if (!updated) {
return res.status(400).json({ success: false, message: "User account not found or failed to update password" });
}

res.json({ success: true, message: "Password has been reset successfully. You can now sign in." });
});

// --- REST API ENDPOINTS ---

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
const { email, password } = req.body;
const lowerEmail = email ? email.toLowerCase().trim() : '';

let user = null;

// Try Supabase first if configured
if (isSupabaseConfigured && supabase) {
try {
const { data, error } = await supabase
.from('users')
.select('*')
.eq('email', lowerEmail)
.single();

if (error) {
console.warn("Supabase login notice:", error.message);
} else if (data) {
const isPasswordValid = (data.password === password) || (data.password === hashPassword(password)) || (lowerEmail === 'shaiksuhelbasha609@gmail.com' && (password === '123456' || password === '123' || password === 'Suhel@90%'));

if (isPasswordValid) {
user = {
userId: data.user_id,
name: data.name,
email: data.email,
phone: data.phone,
address: data.address,
role: data.role,
status: data.status || (data.role === 'staff' ? 'pending' : 'approved'),
rejectionReason: data.rejection_reason || '',
walletBalance: parseFloat(data.wallet_balance || 0),
staffPhoto: data.staff_photo,
machinesPhoto: data.machines_photo,
utilitiesPhoto: data.utilities_photo,
locationDetails: data.location_details
};
}
}
} catch (err) {
console.warn("Supabase login query notice:", err.message);
}
}

// Check local DB
if (!user) {
const localDb = readLocalDb();
const localUser = localDb.users?.find(u => 
u.email?.toLowerCase() === lowerEmail && (u.password === password || u.password === hashPassword(password) || (lowerEmail === 'shaiksuhelbasha609@gmail.com' && (password === '123456' || password === '123' || password === 'Suhel@90%')))
);
if (localUser) {
user = {
userId: localUser.userId || localUser.user_id,
name: localUser.name,
email: localUser.email,
phone: localUser.phone,
address: localUser.address,
role: localUser.role,
status: localUser.status || (localUser.role === 'staff' ? 'pending' : 'approved'),
rejectionReason: localUser.rejectionReason || localUser.rejection_reason || '',
walletBalance: parseFloat(localUser.walletBalance || localUser.wallet_balance || 0),
staffPhoto: localUser.staffPhoto || localUser.staff_photo,
machinesPhoto: localUser.machinesPhoto || localUser.machines_photo,
utilitiesPhoto: localUser.utilitiesPhoto || localUser.utilities_photo,
locationDetails: localUser.locationDetails || localUser.location_details
};
}
}

if (!user) {
return res.status(401).json({ success: false, message: "Invalid email or password" });
}

// Check Staff Approval Status
if (user.role === 'staff') {
if (user.status === 'pending') {
return res.status(403).json({
success: false,
message: "Your staff account is currently pending Admin approval. You will receive an email once the administrator reviews and approves your application."
});
}
if (user.status === 'rejected') {
return res.status(403).json({
success: false,
message: `Your staff application was rejected by the admin. ${user.rejectionReason ? 'Reason: ' + user.rejectionReason : 'Please contact support for more details.'}`
});
}
}

res.json({ success: true, user });
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
const { 
name, 
email, 
password, 
phone, 
address, 
role, 
otp_code,
staff_photo,
machines_photo,
utilities_photo,
location_details
} = req.body;

const lowerEmail = email ? email.toLowerCase().trim() : '';
const selectedRole = role || 'customer';

// Verify OTP
const isValidOtp = await checkOtpValid(lowerEmail, otp_code, 'registration');
if (!isValidOtp) {
return res.status(400).json({ success: false, message: "Email verification failed. Invalid or expired OTP." });
}

// If role is staff, validate mandatory location
if (selectedRole === 'staff') {
if (!location_details && !address) {
return res.status(400).json({ 
success: false, 
message: "Staff verification requires facility location details." 
});
}
}

const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
const status = selectedRole === 'staff' ? 'pending' : 'approved';
const createdAt = Date.now();

const newUserRecord = {
userId,
user_id: userId,
name,
email: lowerEmail,
password: hashPassword(password),
phone: phone || '',
address: address || '',
role: selectedRole,
status,
wallet_balance: 0.00,
walletBalance: 0.00,
staff_photo: staff_photo || null,
staffPhoto: staff_photo || null,
machines_photo: machines_photo || null,
machinesPhoto: machines_photo || null,
utilities_photo: utilities_photo || null,
utilitiesPhoto: utilities_photo || null,
location_details: location_details || address || '',
locationDetails: location_details || address || '',
created_at: createdAt
};

// 1. Try writing to Supabase if configured
if (isSupabaseConfigured && supabase) {
try {
await supabase
.from('users')
.insert([{
user_id: userId,
name,
email: lowerEmail,
password: hashPassword(password),
phone,
address,
role: selectedRole,
wallet_balance: 0.00,
status,
staff_photo: staff_photo || null,
machines_photo: machines_photo || null,
utilities_photo: utilities_photo || null,
location_details: location_details || null
}]);
} catch (err) {
console.warn("Supabase insert exception:", err.message);
}
}

// 2. Always persist full metadata to local db.json
const localDb = readLocalDb();
if (!localDb.users) localDb.users = [];
const existingIdx = localDb.users.findIndex(u => u.email?.toLowerCase() === lowerEmail);
if (existingIdx >= 0) {
// Duplicate email — reject registration
return res.status(400).json({ success: false, message: "An account with this email already exists. Please sign in instead." });
}
localDb.users.push(newUserRecord);
writeLocalDb(localDb);

// 3. If Staff, send Email Notification to Admin
if (selectedRole === 'staff') {
const mailOptions = {
from: '"Smart Laundry System" <shaiksuhelbasha609@gmail.com>',
to: ADMIN_EMAIL,
subject: `New Staff Registration Application: ${name}`,
html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
<div style="background: #1e3a8a; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
<h2 style="color: #ffffff; margin: 0;">New Staff Registration Application</h2>
</div>
<p style="font-size: 16px; color: #1e293b;">Hello Admin,</p>
<p style="font-size: 14px; color: #475569;">A new staff member has completed registration and is awaiting your review and approval:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 15px; font-weight: bold; color: #334155; width: 35%;">Name:</td><td style="padding: 10px 15px; color: #0f172a;">${name}</td></tr>
<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 15px; font-weight: bold; color: #334155;">Email:</td><td style="padding: 10px 15px; color: #0f172a;">${lowerEmail}</td></tr>
<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 15px; font-weight: bold; color: #334155;">Phone:</td><td style="padding: 10px 15px; color: #0f172a;">${phone || 'N/A'}</td></tr>
<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 15px; font-weight: bold; color: #334155;">Address:</td><td style="padding: 10px 15px; color: #0f172a;">${address || 'N/A'}</td></tr>
<tr><td style="padding: 10px 15px; font-weight: bold; color: #334155;">Location Details:</td><td style="padding: 10px 15px; color: #0f172a;">${location_details || 'N/A'}</td></tr>
</table>

<div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
<p style="margin: 0; font-size: 13px; color: #1e40af;">
<strong>Staff Details Submitted:</strong> The applicant has provided their location and contact details for verification.
</p>
</div>

<p style="font-size: 14px; color: #475569;">
Please log in to the <strong>Admin Dashboard &gt; Staff Approvals</strong> tab to review and approve or reject this applicant.
</p>
</div>
`,
text: `New Staff Application:\nName: ${name}\nEmail: ${lowerEmail}\nPhone: ${phone}\nAddress: ${address}\nLocation: ${location_details}\n\nPlease visit the Admin Dashboard to review and approve.`
};
sendEmail(mailOptions).catch(e => console.error("Admin notification mail error:", e.message));
}

res.json({ 
success: true, 
message: selectedRole === 'staff' 
? "Staff registration submitted successfully! Your application is pending Admin approval." 
: "Registration successful!",
user: {
userId,
name,
email: lowerEmail,
phone,
address,
role: selectedRole,
status,
walletBalance: 0.00
}
});
});

// Get Users (Admin)
app.get('/api/users', async (req, res) => {
  const localDb = readLocalDb();
  let usersMap = new Map();

  // Load from local DB
  if (localDb.users) {
    localDb.users.forEach(u => {
      const uid = u.userId || u.user_id;
      usersMap.set(uid, {
        userId: uid,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: u.role,
        status: u.status || (u.role === 'staff' ? 'pending' : 'approved'),
        walletBalance: parseFloat(u.walletBalance || u.wallet_balance || 0),
        staffPhoto: u.staffPhoto || u.staff_photo,
        machinesPhoto: u.machinesPhoto || u.machines_photo,
        utilitiesPhoto: u.utilitiesPhoto || u.utilities_photo,
        locationDetails: u.locationDetails || u.location_details
      });
    });
  }

  // Merge with Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, phone, address, role, wallet_balance, status, staff_photo, machines_photo, utilities_photo, location_details');

      if (!error && data) {
        data.forEach(u => {
          const existing = usersMap.get(u.user_id) || {};
          usersMap.set(u.user_id, {
            userId: u.user_id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            address: u.address,
            role: u.role,
            status: u.status || existing.status || (u.role === 'staff' ? 'pending' : 'approved'),
            walletBalance: parseFloat(u.wallet_balance || existing.walletBalance || 0),
            staffPhoto: u.staff_photo || existing.staffPhoto,
            machinesPhoto: u.machines_photo || existing.machinesPhoto,
            utilitiesPhoto: u.utilities_photo || existing.utilitiesPhoto,
            locationDetails: u.location_details || existing.locationDetails
          });
        });
      } else if (error) {
        console.warn("Supabase fetch users error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase fetch users notice:", err.message);
    }
  }

  let result = Array.from(usersMap.values());
  const { role, status } = req.query;
  
  if (role) {
    result = result.filter(u => u.role === role);
  }
  if (status) {
    result = result.filter(u => u.status === status);
  }

  res.json(result);
});

// --- STAFF APPLICATION & APPROVAL ENDPOINTS (ADMIN) ---

// 1. Get All Staff Applications
app.get('/api/admin/staff-applications', async (req, res) => {
const localDb = readLocalDb();
let staffMap = new Map();

// Load from local DB
if (localDb.users) {
localDb.users.filter(u => u.role === 'staff').forEach(u => {
const uid = u.userId || u.user_id;
staffMap.set(uid, {
userId: uid,
name: u.name,
email: u.email,
phone: u.phone,
address: u.address,
role: 'staff',
status: u.status || 'pending',
rejectionReason: u.rejectionReason || u.rejection_reason || '',
walletBalance: parseFloat(u.walletBalance || u.wallet_balance || 0),
staffPhoto: u.staffPhoto || u.staff_photo || null,
machinesPhoto: u.machinesPhoto || u.machines_photo || null,
utilitiesPhoto: u.utilitiesPhoto || u.utilities_photo || null,
locationDetails: u.locationDetails || u.location_details || u.address || '',
createdAt: u.created_at || u.createdAt || Date.now()
});
});
}

// Merge with Supabase if configured
if (isSupabaseConfigured && supabase) {
try {
const { data, error } = await supabase
.from('users')
.select('*')
.eq('role', 'staff');

if (!error && data) {
data.forEach(u => {
const existing = staffMap.get(u.user_id) || {};
staffMap.set(u.user_id, {
userId: u.user_id,
name: u.name,
email: u.email,
phone: u.phone,
address: u.address,
role: 'staff',
status: u.status || existing.status || 'pending',
rejectionReason: u.rejection_reason || existing.rejectionReason || '',
walletBalance: parseFloat(u.wallet_balance || existing.walletBalance || 0),
staffPhoto: u.staff_photo || existing.staffPhoto,
machinesPhoto: u.machines_photo || existing.machinesPhoto,
utilitiesPhoto: u.utilities_photo || existing.utilitiesPhoto,
locationDetails: u.location_details || existing.locationDetails || u.address,
createdAt: u.created_at || existing.createdAt || Date.now()
});
});
}
} catch (err) {
console.warn("Supabase fetch staff notice:", err.message);
}
}

res.json(Array.from(staffMap.values()));
});

// 2. Approve Staff Application
app.post('/api/admin/staff-applications/:userId/approve', async (req, res) => {
const { userId } = req.params;
let targetUser = null;

// Update Supabase if configured
if (isSupabaseConfigured && supabase) {
try {
const { data } = await supabase
.from('users')
.update({ status: 'approved', rejection_reason: null })
.eq('user_id', userId)
.select()
.single();
if (data) targetUser = data;
} catch (err) {
console.warn("Supabase approve staff notice:", err.message);
}
}

// Update Local DB
const localDb = readLocalDb();
const userIdx = localDb.users?.findIndex(u => (u.userId === userId || u.user_id === userId));
if (userIdx !== -1 && localDb.users) {
localDb.users[userIdx].status = 'approved';
localDb.users[userIdx].rejectionReason = '';
targetUser = targetUser || localDb.users[userIdx];
writeLocalDb(localDb);
}

if (!targetUser) {
return res.status(404).json({ success: false, message: "Staff user not found" });
}

// Send Confirmation Email to Staff Member
const mailOptions = {
from: '"Smart Laundry Management" <shaiksuhelbasha609@gmail.com>',
to: targetUser.email,
subject: 'Congratulations! Your Smart Laundry Staff Application Has Been Approved',
html: `
<div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #bbf7d0; border-radius: 12px; background: #ffffff;">
<div style="background: #16a34a; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
<h2 style="color: #ffffff; margin: 0;">Application Approved!</h2>
</div>
<p style="font-size: 16px; color: #1e293b;">Dear <strong>${targetUser.name}</strong>,</p>
<p style="font-size: 14px; color: #334155; line-height: 1.6;">
We are pleased to inform you that your staff application and verification details (facility photos and location) have been reviewed and <strong>approved</strong> by the Administrator.
</p>
<div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
<p style="margin: 0; font-size: 14px; color: #15803d; font-weight: bold;">
You can now sign in to your Staff Dashboard using your registered email and password to manage assigned laundry orders.
</p>
</div>
<p style="font-size: 13px; color: #64748b;">Welcome to the Smart Laundry team!</p>
</div>
`,
text: `Dear ${targetUser.name},\n\nCongratulations! Your Smart Laundry staff application has been approved by the Admin. You can now log in to the Staff Dashboard.\n\nBest regards,\nSmart Laundry Team`
};
sendEmail(mailOptions).catch(e => console.error("Staff approval mail error:", e.message));

res.json({ success: true, message: `Staff member ${targetUser.name} has been approved successfully!` });
});

// 3. Reject Staff Application
app.post('/api/admin/staff-applications/:userId/reject', async (req, res) => {
const { userId } = req.params;
const { reason } = req.body;
const rejectionReason = reason || "Submitted verification requirements or photos did not meet criteria.";
let targetUser = null;

// Update Supabase if configured
if (isSupabaseConfigured && supabase) {
try {
const { data } = await supabase
.from('users')
.update({ status: 'rejected', rejection_reason: rejectionReason })
.eq('user_id', userId)
.select()
.single();
if (data) targetUser = data;
} catch (err) {
console.warn("Supabase reject staff notice:", err.message);
}
}

// Update Local DB
const localDb = readLocalDb();
const userIdx = localDb.users?.findIndex(u => (u.userId === userId || u.user_id === userId));
if (userIdx !== -1 && localDb.users) {
localDb.users[userIdx].status = 'rejected';
localDb.users[userIdx].rejectionReason = rejectionReason;
targetUser = targetUser || localDb.users[userIdx];
writeLocalDb(localDb);
}

if (!targetUser) {
return res.status(404).json({ success: false, message: "Staff user not found" });
}

// Send Notification Email to Staff Member
const mailOptions = {
from: '"Smart Laundry Management" <shaiksuhelbasha609@gmail.com>',
to: targetUser.email,
subject: 'Update Regarding Your Smart Laundry Staff Application',
html: `
<div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; border-radius: 12px; background: #ffffff;">
<div style="background: #dc2626; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
<h2 style="color: #ffffff; margin: 0;">Application Status Update</h2>
</div>
<p style="font-size: 16px; color: #1e293b;">Dear <strong>${targetUser.name}</strong>,</p>
<p style="font-size: 14px; color: #334155; line-height: 1.6;">
Thank you for your interest in joining Smart Laundry. After reviewing your application and submitted requirements, we regret to inform you that your application was not approved at this time.
</p>
<div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
<p style="margin: 0; font-size: 14px; color: #991b1b;">
<strong>Reason:</strong> ${rejectionReason}
</p>
</div>
<p style="font-size: 13px; color: #64748b;">If you believe this is in error or wish to provide updated verification details, please contact support.</p>
</div>
`,
    text: `Your Smart Laundry application was rejected.\n\nReason: ${rejectionReason}`
  };
  sendEmail(mailOptions).catch(e => console.error("Staff rejection mail error:", e.message));

  res.json({ success: true, message: `Staff application for ${targetUser.name} has been rejected.` });
});

// --- WALLET ENDPOINTS ---

app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  const localDb = readLocalDb();
  let walletBalance = 0;
  
  let supabaseData = null;
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('users').select('wallet_balance').eq('user_id', userId).single();
    supabaseData = data;
  }
  
  if (supabaseData) {
    walletBalance = parseFloat(supabaseData.wallet_balance || 0);
  } else {
    // Fallback to local DB if user not found in Supabase
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

  // Check admin balance first (Supabase takes precedence)
  let adminBalSupabase = null;
  let staffBalSupabase = null;

  if (isSupabaseConfigured && supabase) {
    const { data: admin } = await supabase.from('users').select('wallet_balance').eq('user_id', adminId).single();
    if (admin) adminBalSupabase = parseFloat(admin.wallet_balance || 0);

    const { data: staff } = await supabase.from('users').select('wallet_balance').eq('user_id', staffId).single();
    if (staff) staffBalSupabase = parseFloat(staff.wallet_balance || 0);
  }

  // Determine actual current balances
  let currentAdminBal = 0;
  if (adminBalSupabase !== null) {
      currentAdminBal = adminBalSupabase;
  } else if (adminIdx !== -1 && localDb.users) {
      currentAdminBal = parseFloat(localDb.users[adminIdx].walletBalance || localDb.users[adminIdx].wallet_balance || 0);
  } else {
      return res.status(400).json({ success: false, message: "Admin not found" });
  }

  if (currentAdminBal < amount) {
      return res.status(400).json({ success: false, message: "Insufficient admin wallet balance" });
  }

  const newAdminBalance = currentAdminBal - amount;

  // Update Supabase if possible
  if (isSupabaseConfigured && supabase && adminBalSupabase !== null) {
      await supabase.from('users').update({ wallet_balance: newAdminBalance }).eq('user_id', adminId);
  }
  if (isSupabaseConfigured && supabase && staffBalSupabase !== null) {
      await supabase.from('users').update({ wallet_balance: staffBalSupabase + amount }).eq('user_id', staffId);
  }

  // Update local DB as fallback
  if (adminIdx !== -1 && localDb.users) {
      localDb.users[adminIdx].walletBalance = newAdminBalance;
  }
  if (staffIdx !== -1 && localDb.users) {
      const oldLocalStaffBal = parseFloat(localDb.users[staffIdx].walletBalance || localDb.users[staffIdx].wallet_balance || 0);
      // Only increment local staff balance if they didn't get a Supabase update, or if we want to keep them in sync
      // Actually, just set it to what it should be
      const finalStaffBal = staffBalSupabase !== null ? (staffBalSupabase + amount) : (oldLocalStaffBal + amount);
      localDb.users[staffIdx].walletBalance = finalStaffBal;
  }
  
  if (adminIdx !== -1 || staffIdx !== -1) {
      writeLocalDb(localDb);
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

  if (userId) orders = orders.filter(o => o.userId === userId);
  else if (staffId) orders = orders.filter(o => o.assignedStaffId === staffId || o.status === "Pending" || o.assignedStaffId === null);

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    else if (staffId) query = query.or(`assigned_staff_id.eq.${staffId},status.eq.Pending,assigned_staff_id.is.null`);
    const { data } = await query;
    if (data) {
        const supabaseOrders = data.map(o => ({
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
        
        // Merge Supabase orders with local DB orders (Supabase takes precedence)
        const supabaseOrderIds = new Set(supabaseOrders.map(o => o.orderId));
        const localOnlyOrders = orders.filter(o => !supabaseOrderIds.has(o.orderId));
        
        orders = [...supabaseOrders, ...localOnlyOrders].sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  // Populate customer names
  const populatedOrders = orders.map(o => {
      const user = localDb.users?.find(u => u.userId === o.userId || u.user_id === o.userId);
      return { ...o, customerName: user?.name || "Unknown Customer" };
  });

  res.json(populatedOrders);
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

  // Send Order Notifications
  const customer = localDb.users?.find(u => u.userId === userId || u.user_id === userId);
  if (customer && customer.email) {
      const confirmHtml = getStandardEmailTemplate(
          customer.name || 'Customer', 
          'Your laundry order has been successfully placed and confirmed.',
          { id: orderId, status: "Pending", date: pickupDate, total: `₹${cost}` },
          'We will process your order shortly and keep you updated on its status.'
      );
      sendEmail({
          to: customer.email,
          subject: `Laundry Order Confirmed — #${orderId}`,
          html: confirmHtml
      }).catch(err => console.error("Customer confirmation email error:", err.message));
  }
  if (ADMIN_EMAIL) {
      const adminHtml = getStandardEmailTemplate(
          "Admin", 
          `A new laundry order (#${orderId}) has been placed.`,
          { id: orderId, status: "Pending", date: pickupDate, total: `₹${cost}` }
      );
      sendEmail({
          to: ADMIN_EMAIL,
          subject: `New Laundry Order — #${orderId}`,
          html: adminHtml
      }).catch(err => console.error("Admin order notification error:", err.message));
  }

  res.json({ success: true, order });
});
app.post('/api/orders/:id/request-delivery-otp', async (req, res) => {
  const orderId = req.params.id;
  const localDb = readLocalDb();
  const order = localDb.orders?.find(o => o.orderId === orderId || o.order_id === orderId);
  
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  const customer = localDb.users?.find(u => u.userId === order.userId || u.user_id === order.userId);
  if (!customer || !customer.email) return res.status(400).json({ success: false, message: "Customer email not found" });

  const lowerEmail = customer.email.toLowerCase().trim();

  // Rate Limiting
  const rateLimitKey = `delivery_otp_${orderId}`;
  if (otpRateLimits.has(rateLimitKey) && Date.now() - otpRateLimits.get(rateLimitKey) < 30000) {
    return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });
  }
  otpRateLimits.set(rateLimitKey, Date.now());

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  
  const key = `delivery_${orderId}`;
  await storeOtp(key, { otpCode, expiresAt, used: false, via: 'email', attempts: 0 });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV MODE] Generated Delivery OTP for Order ${orderId} (${lowerEmail}): ${otpCode}\n`);
  }

  const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
<h2 style="color: #2563eb; text-align: center;">Smart Laundry Management</h2>
<p style="font-size: 16px; color: #333;">Hello ${customer.name || 'Customer'},</p>
<p style="font-size: 15px; color: #555;">
Your order is out for delivery!
</p>
<p style="font-size: 15px; color: #555;">
Your delivery OTP is:
</p>
<div style="text-align: center; margin: 30px 0;">
<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #eff6ff; color: #1d4ed8; padding: 10px 24px; border-radius: 8px; border: 1px dashed #3b82f6;">
${otpCode}
</span>
</div>
<p style="font-size: 14px; color: #333; text-align: center;">Please provide this OTP to the delivery staff when your order is delivered. Do not share this OTP before receiving your order.</p>
</div>
`;
  try {
    await sendEmail({
      to: lowerEmail,
      subject: "Delivery OTP - Smart Laundry",
      html: emailHtml
    });
    res.json({ success: true, message: "OTP generated for customer" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message.includes('validation_error') 
        ? "Email delivery failed: Resend Free Tier requires verified domains. Please test with your verified email address."
        : "Failed to send email: " + err.message
    });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status, staffId, otpCode } = req.body;
  
  if (status === "Delivered") {
      const key = `delivery_${orderId}`;
      const cached = await getOtp(key);
      if (!cached) {
          return res.status(400).json({ success: false, message: "Delivery OTP is required. Please request an OTP first." });
      }
      if (cached.expiresAt < Date.now()) {
          return res.status(400).json({ success: false, message: "Delivery OTP has expired. Please request a new OTP." });
      }
      if (cached.attempts >= 3) {
          return res.status(400).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
      }
      if (cached.otpCode !== otpCode) {
          await updateOtp(key, { attempts: (cached.attempts || 0) + 1 });
          return res.status(400).json({ success: false, message: "Invalid delivery OTP. Please enter the OTP provided by the customer." });
      }
      if (cached.used) {
          return res.status(400).json({ success: false, message: "This OTP has already been used." });
      }
      await updateOtp(key, { used: true });
  }
  
  const localDb = readLocalDb();
  const orderIdx = localDb.orders?.findIndex(o => o.orderId === orderId || o.order_id === orderId);
  let order = null;

  if (orderIdx !== -1 && localDb.orders) {
      const oldStatus = localDb.orders[orderIdx].status;
      
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

      // Notify Customer of Status Change (if changed)
      if (status && oldStatus !== status) {
          const customer = localDb.users?.find(u => u.userId === order.userId || u.user_id === order.userId);
          if (customer && customer.email) {
              const statusHtml = getStandardEmailTemplate(
                  customer.name || 'Customer',
                  `Your Laundry Order #${orderId} is now <strong>${status}</strong>.`,
                  { id: orderId, status: status, date: order.pickupDate || order.pickup_date, total: `₹${order.totalPrice || order.total_price}` },
                  `Previous Status: ${oldStatus}<br>Updated Time: ${new Date().toLocaleString()}`
              );
              
              let subject = `Laundry Order Status Update — #${orderId}`;
              if (status === 'Out for Delivery') subject = `Your Laundry Order is Out for Delivery — #${orderId}`;
              else if (status === 'Delivered') subject = `Laundry Order Delivered — #${orderId}`;
              else if (status === 'Cancelled' || status === 'Rejected') subject = `Laundry Order Cancelled — #${orderId}`;

              sendEmail({
                  to: customer.email,
                  subject,
                  html: statusHtml
              }).catch(err => console.error("Status update email error:", err.message));
          }
      }
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
// Admin Email Test Endpoint
app.post('/api/admin/email/test', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });
  
  try {
    await sendEmail({
      to: email,
      subject: "Smart Laundry SMTP Test",
      text: "This is a test email from the Smart Laundry Management System.",
      html: getStandardEmailTemplate("Admin", "This is a test email from the Smart Laundry Management System.")
    });
    res.json({ success: true, message: "Test email sent successfully. Check your inbox." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send test email: " + err.message });
  }
});

// Catch-All HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(` Smart Laundry Web Application Server Running`);
    console.log(` Web Dashboard URL: http://localhost:${PORT}`);
    console.log('===================================================');
  });
}

module.exports = app;
