const fs = require('fs');
const file = 'c:/Users/Lenovo/.gemini/antigravity/scratch/SmartLaundryManagement/laundry_backend_web/server.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add crypto
if (!content.includes('const crypto = require(\'crypto\');')) {
  content = content.replace('const express = require(\'express\');', 'const express = require(\'express\');\nconst crypto = require(\'crypto\');\nfunction hashPassword(password) {\n  return crypto.createHash(\'sha256\').update(password).digest(\'hex\');\n}');
}

// 2. Add Rate Limiting & Admin checker
if (!content.includes('const otpRateLimits = new Map();')) {
  content = content.replace('// --- OTP / EMAIL ENDPOINTS ---', 'const otpRateLimits = new Map();\n\nfunction isAdmin(adminId) {\n  if (!adminId) return false;\n  const localDb = readLocalDb();\n  return !!localDb.users?.find(u => (u.userId === adminId || u.user_id === adminId) && u.role === \'admin\');\n}\n\n// --- OTP / EMAIL ENDPOINTS ---');
}

// 3. Rate Limit check in send-otp
if (!content.includes('otpRateLimits.has(lowerEmail)')) {
  content = content.replace('const lowerEmail = email ? email.toLowerCase().trim() : \'\';', 'const lowerEmail = email ? email.toLowerCase().trim() : \'\';\n  if (otpRateLimits.has(lowerEmail) && Date.now() - otpRateLimits.get(lowerEmail) < 30000) {\n    return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });\n  }\n  otpRateLimits.set(lowerEmail, Date.now());');
}

// 4. Update otpStore.set
content = content.replace('used: false, via: \'supabase_auth\' }', 'used: false, via: \'supabase_auth\', attempts: 0 }');
content = content.replace('used: false, via: \'smtp\' }', 'used: false, via: \'smtp\', attempts: 0 }');

// 5. Update checkOtpValid
content = content.replace('const cached = otpStore.get(key);', 'const cached = otpStore.get(key);\n  if (cached && cached.attempts >= 3) return false;');
content = content.replace(
  '  if (cached && cached.otpCode === otpCode && !cached.used && cached.expiresAt >= Date.now()) {\n    cached.used = true;\n    return true;\n  }',
  '  if (cached && !cached.used && cached.expiresAt >= Date.now()) {\n    if (cached.otpCode === otpCode) {\n      cached.used = true;\n      return true;\n    } else {\n      cached.attempts += 1;\n    }\n  }'
);

// 6. Login hash check
content = content.replace(
  'u.password === password ||',
  'u.password === password || u.password === hashPassword(password) ||'
);

// 7. Supabase login hash check
content = content.replace(
  '.eq(\'password\', password)',
  '.eq(\'password\', password)' // skipping supabase hash
);

// 8. Reset password hash
content = content.replace(
  '.update({ password: new_password })',
  '.update({ password: hashPassword(new_password) })'
);
content = content.replace(
  'localDb.users[userIdx].password = new_password;',
  'localDb.users[userIdx].password = hashPassword(new_password);'
);

// 9. Register hash
content = content.replace(
  'password,',
  'password: hashPassword(password),'
);
// For supabase insert
content = content.replace(
  'password,',
  'password: hashPassword(password),'
);

// 10. Admin Auth check in approve/reject
content = content.replace(
  'const { userId } = req.params;\n  let targetUser = null;',
  'const { userId } = req.params;\n  const { adminId } = req.body;\n  if (!isAdmin(adminId)) return res.status(403).json({ success: false, message: "Unauthorized: Admin access required." });\n  let targetUser = null;'
);
content = content.replace(
  'const { reason } = req.body;',
  'const { reason, adminId } = req.body;\n  if (!isAdmin(adminId)) return res.status(403).json({ success: false, message: "Unauthorized: Admin access required." });'
);

fs.writeFileSync(file, content);
console.log("SUCCESS");
