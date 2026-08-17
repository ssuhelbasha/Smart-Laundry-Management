'use strict';
/**
 * Test Case Data for Smart Laundry Appium Tests
 * 400+ structured test cases across all modules
 */

const TEST_DATA = {
  validUser: {
    email: 'shaiksuhelbasha609@gmail.com',
    password: '123',
    role: 'customer',
  },
  adminUser: {
    email: 'admin@laundry.com',
    password: '123',
    role: 'admin',
  },
  staffUser: {
    email: 'staff@laundry.com',
    password: '123',
    role: 'staff',
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
  },
  newUser: {
    name: 'Test User',
    email: `test_${Date.now()}@test.com`,
    password: 'Test@1234',
    phone: '9876543210',
    address: 'Test Address, Test City',
  },
  orders: {
    serviceTypes: ['Standard Wash', 'Dry Cleaning', 'Premium Wash', 'Quick Wash'],
    fabricTypes: ['cotton', 'silk', 'saree', 'kurtas', 'polyester'],
    quantities: [1, 2, 5, 10],
    pickupDates: ['2026-09-01', '2026-09-15', '2026-10-01'],
  },
  wallet: {
    topupAmount: 100,
    invalidAmount: -50,
    zeroAmount: 0,
    largeAmount: 99999,
  },
  otp: {
    valid: '123456',
    invalid: '000000',
    expired: '999999',
    malformed: 'ABCDEF',
  },
};

// ─────────────────────────────────────────────────────────────────
// AUTHENTICATION TEST CASES (TC_AUTH_001 – TC_AUTH_040)
// ─────────────────────────────────────────────────────────────────
const AUTH_TEST_CASES = [
  { id: 'TC_AUTH_001', name: 'Valid Customer Login', priority: 'P0', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter valid email', 'Enter valid password', 'Tap Login'],
    expected: 'Customer dashboard displayed', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_002', name: 'Valid Admin Login', priority: 'P0', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter admin email', 'Enter admin password', 'Tap Login'],
    expected: 'Admin dashboard displayed', data: TEST_DATA.adminUser },
  { id: 'TC_AUTH_003', name: 'Valid Staff Login', priority: 'P0', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter staff email', 'Enter staff password', 'Tap Login'],
    expected: 'Staff dashboard displayed', data: TEST_DATA.staffUser },
  { id: 'TC_AUTH_004', name: 'Invalid Email Login', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter invalid email', 'Enter any password', 'Tap Login'],
    expected: 'Error message: Invalid email or password', data: TEST_DATA.invalidUser },
  { id: 'TC_AUTH_005', name: 'Wrong Password Login', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter valid email', 'Enter wrong password', 'Tap Login'],
    expected: 'Error message displayed', data: { email: TEST_DATA.validUser.email, password: 'wrong' } },
  { id: 'TC_AUTH_006', name: 'Empty Email Field', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Leave email empty', 'Enter password', 'Tap Login'],
    expected: 'Validation error: Email required', data: { email: '', password: '123' } },
  { id: 'TC_AUTH_007', name: 'Empty Password Field', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter email', 'Leave password empty', 'Tap Login'],
    expected: 'Validation error: Password required', data: { email: TEST_DATA.validUser.email, password: '' } },
  { id: 'TC_AUTH_008', name: 'Both Fields Empty', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Leave all fields empty', 'Tap Login'],
    expected: 'Validation errors displayed', data: { email: '', password: '' } },
  { id: 'TC_AUTH_009', name: 'SQL Injection in Email', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ["Enter ' OR 1=1 -- in email", 'Enter password', 'Tap Login'],
    expected: 'Login rejected, no SQL error', data: { email: "' OR 1=1 --", password: '123' } },
  { id: 'TC_AUTH_010', name: 'XSS in Email Field', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter XSS payload in email', 'Tap Login'],
    expected: 'Input sanitized, no script execution', data: { email: '<script>alert(1)</script>', password: '123' } },
  { id: 'TC_AUTH_011', name: 'Case Insensitive Email Login', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter email in UPPERCASE', 'Enter valid password', 'Tap Login'],
    expected: 'Login succeeds (case insensitive)', data: { email: TEST_DATA.validUser.email.toUpperCase(), password: '123' } },
  { id: 'TC_AUTH_012', name: 'Email with Spaces', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter email with leading/trailing spaces', 'Tap Login'],
    expected: 'Spaces trimmed, login handled properly', data: { email: '  ' + TEST_DATA.validUser.email + '  ', password: '123' } },
  { id: 'TC_AUTH_013', name: 'Very Long Email', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter 500+ character email', 'Tap Login'],
    expected: 'Input rejected or error shown gracefully', data: { email: 'a'.repeat(500) + '@test.com', password: '123' } },
  { id: 'TC_AUTH_014', name: 'Invalid Email Format', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter email without @', 'Tap Login'],
    expected: 'Validation error: Invalid email format', data: { email: 'notanemail', password: '123' } },
  { id: 'TC_AUTH_015', name: 'Logout Customer', priority: 'P0', module: 'Authentication',
    preconditions: 'Customer logged in', steps: ['Tap Logout button'],
    expected: 'User logged out, redirected to login screen', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_016', name: 'Logout Admin', priority: 'P0', module: 'Authentication',
    preconditions: 'Admin logged in', steps: ['Tap Logout button'],
    expected: 'Admin logged out, redirected to login screen', data: TEST_DATA.adminUser },
  { id: 'TC_AUTH_017', name: 'Logout Staff', priority: 'P0', module: 'Authentication',
    preconditions: 'Staff logged in', steps: ['Tap Logout button'],
    expected: 'Staff logged out, redirected to login screen', data: TEST_DATA.staffUser },
  { id: 'TC_AUTH_018', name: 'Session Persistence After App Restart', priority: 'P1', module: 'Authentication',
    preconditions: 'User logged in', steps: ['Close app', 'Reopen app'],
    expected: 'User session restored from local storage', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_019', name: 'Forgot Password - Valid Email', priority: 'P1', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Tap Forgot Password', 'Enter valid email', 'Tap Send OTP'],
    expected: 'OTP sent successfully message shown', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_020', name: 'Forgot Password - Invalid Email', priority: 'P1', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Tap Forgot Password', 'Enter invalid email', 'Tap Send OTP'],
    expected: 'Error message displayed', data: TEST_DATA.invalidUser },
  { id: 'TC_AUTH_021', name: 'OTP Verification - Valid OTP', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP sent to email', steps: ['Enter valid OTP', 'Tap Verify'],
    expected: 'OTP verified successfully', data: { otp: TEST_DATA.otp.valid } },
  { id: 'TC_AUTH_022', name: 'OTP Verification - Invalid OTP', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP sent to email', steps: ['Enter invalid OTP', 'Tap Verify'],
    expected: 'Error: Invalid or expired OTP', data: { otp: TEST_DATA.otp.invalid } },
  { id: 'TC_AUTH_023', name: 'OTP Verification - Expired OTP', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP sent > 10 min ago', steps: ['Enter expired OTP', 'Tap Verify'],
    expected: 'Error: OTP expired', data: { otp: TEST_DATA.otp.expired } },
  { id: 'TC_AUTH_024', name: 'OTP Verification - Wrong Format', priority: 'P2', module: 'Authentication',
    preconditions: 'On OTP screen', steps: ['Enter alphabetic OTP', 'Tap Verify'],
    expected: 'Validation error: Enter 6-digit code', data: { otp: TEST_DATA.otp.malformed } },
  { id: 'TC_AUTH_025', name: 'Password Reset - Valid Flow', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP verified', steps: ['Enter new password', 'Confirm new password', 'Tap Reset'],
    expected: 'Password reset successfully', data: { password: 'NewPass@123' } },
  { id: 'TC_AUTH_026', name: 'Password Reset - Mismatched Passwords', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP verified', steps: ['Enter new password', 'Enter different confirm password', 'Tap Reset'],
    expected: 'Error: Passwords do not match', data: { password: 'Pass1', confirmPassword: 'Pass2' } },
  { id: 'TC_AUTH_027', name: 'Password Reset - Empty Fields', priority: 'P1', module: 'Authentication',
    preconditions: 'OTP verified', steps: ['Leave password fields empty', 'Tap Reset'],
    expected: 'Validation error shown', data: { password: '' } },
  { id: 'TC_AUTH_028', name: 'Register Tab Switch', priority: 'P2', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Tap Register tab/link'],
    expected: 'Registration form displayed', data: {} },
  { id: 'TC_AUTH_029', name: 'Login Screen UI Elements', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Check all UI elements visible'],
    expected: 'Email field, Password field, Login button all visible', data: {} },
  { id: 'TC_AUTH_030', name: 'Login with Special Characters Password', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter email', 'Enter password with special chars', 'Tap Login'],
    expected: 'Login handled gracefully', data: { email: TEST_DATA.validUser.email, password: '!@#$%^&*()' } },
  { id: 'TC_AUTH_031', name: 'Multiple Failed Login Attempts', priority: 'P1', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter wrong credentials 5 times'],
    expected: 'All attempts rejected with error messages', data: {} },
  { id: 'TC_AUTH_032', name: 'Network Error During Login', priority: 'P2', module: 'Authentication',
    preconditions: 'No network', steps: ['Enable airplane mode', 'Attempt login'],
    expected: 'Network error message displayed gracefully', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_033', name: 'Login Button Loading State', priority: 'P2', module: 'Authentication',
    preconditions: 'App launched', steps: ['Enter credentials', 'Tap Login', 'Observe button'],
    expected: 'Loading indicator shown during request', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_034', name: 'Password Masking', priority: 'P2', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Type in password field', 'Observe masking'],
    expected: 'Password characters masked by default', data: {} },
  { id: 'TC_AUTH_035', name: 'Password Visibility Toggle', priority: 'P2', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Tap show password eye icon'],
    expected: 'Password revealed/hidden on toggle', data: {} },
  { id: 'TC_AUTH_036', name: 'Remember Me / Stay Logged In', priority: 'P2', module: 'Authentication',
    preconditions: 'On login screen', steps: ['Login', 'Close and reopen app'],
    expected: 'User stays logged in', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_037', name: 'Admin Cannot Access Customer Dashboard', priority: 'P0', module: 'Authentication',
    preconditions: 'Admin logged in', steps: ['Navigate to customer dashboard URL'],
    expected: 'Redirected to admin dashboard', data: TEST_DATA.adminUser },
  { id: 'TC_AUTH_038', name: 'Customer Cannot Access Admin Dashboard', priority: 'P0', module: 'Authentication',
    preconditions: 'Customer logged in', steps: ['Attempt to access admin features'],
    expected: 'Access denied or redirected', data: TEST_DATA.validUser },
  { id: 'TC_AUTH_039', name: 'Staff Cannot Access Admin Features', priority: 'P0', module: 'Authentication',
    preconditions: 'Staff logged in', steps: ['Attempt to access admin-only features'],
    expected: 'Access denied', data: TEST_DATA.staffUser },
  { id: 'TC_AUTH_040', name: 'Concurrent Session Handling', priority: 'P2', module: 'Authentication',
    preconditions: 'User logged in on device 1', steps: ['Login same user on device 2'],
    expected: 'Both sessions handled or first session invalidated', data: TEST_DATA.validUser },
];

// ─────────────────────────────────────────────────────────────────
// REGISTRATION TEST CASES (TC_REG_001 – TC_REG_020)
// ─────────────────────────────────────────────────────────────────
const REGISTRATION_TEST_CASES = [
  { id: 'TC_REG_001', name: 'Valid Customer Registration Flow', priority: 'P0', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter name', 'Enter email', 'Send OTP', 'Verify OTP', 'Enter password', 'Tap Register'],
    expected: 'Registration successful, redirected to dashboard', data: TEST_DATA.newUser },
  { id: 'TC_REG_002', name: 'Register with Existing Email', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter already registered email', 'Complete form', 'Tap Register'],
    expected: 'Error: Email already exists', data: TEST_DATA.validUser },
  { id: 'TC_REG_003', name: 'Register without OTP', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Fill all fields', 'Skip OTP', 'Tap Register'],
    expected: 'Error: Email verification required', data: TEST_DATA.newUser },
  { id: 'TC_REG_004', name: 'Register with Invalid OTP', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen, OTP sent', steps: ['Enter invalid OTP', 'Tap Verify'],
    expected: 'Error: Invalid OTP', data: { ...TEST_DATA.newUser, otp: '000000' } },
  { id: 'TC_REG_005', name: 'Empty Name Field', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Leave name empty', 'Complete rest', 'Tap Register'],
    expected: 'Validation error: Name required', data: { ...TEST_DATA.newUser, name: '' } },
  { id: 'TC_REG_006', name: 'Invalid Phone Number', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter 4-digit phone number', 'Complete form', 'Tap Register'],
    expected: 'Validation error: Invalid phone number', data: { ...TEST_DATA.newUser, phone: '1234' } },
  { id: 'TC_REG_007', name: 'Empty Address Field', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Leave address empty', 'Tap Register'],
    expected: 'Validation error: Address required', data: { ...TEST_DATA.newUser, address: '' } },
  { id: 'TC_REG_008', name: 'Short Password Validation', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter 2-char password', 'Tap Register'],
    expected: 'Validation error: Password too short', data: { ...TEST_DATA.newUser, password: 'ab' } },
  { id: 'TC_REG_009', name: 'Register as Staff Role', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Select Staff role', 'Complete form', 'Tap Register'],
    expected: 'Staff account created, staff dashboard shown', data: { ...TEST_DATA.newUser, role: 'staff' } },
  { id: 'TC_REG_010', name: 'Register as Admin Role', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Select Admin role', 'Complete form', 'Tap Register'],
    expected: 'Admin account created', data: { ...TEST_DATA.newUser, role: 'admin' } },
  { id: 'TC_REG_011', name: 'OTP Resend Functionality', priority: 'P1', module: 'Registration',
    preconditions: 'On OTP screen', steps: ['Tap Resend OTP button'],
    expected: 'New OTP sent, success message shown', data: TEST_DATA.newUser },
  { id: 'TC_REG_012', name: 'Registration Form Validation - All Empty', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Leave all fields empty', 'Tap Register'],
    expected: 'All field validation errors shown', data: {} },
  { id: 'TC_REG_013', name: 'Email Format Validation in Registration', priority: 'P1', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter invalid email format'],
    expected: 'Validation error: Invalid email', data: { email: 'notemail' } },
  { id: 'TC_REG_014', name: 'Duplicate Phone Number', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter existing phone number', 'Complete form', 'Tap Register'],
    expected: 'Error or warning about duplicate phone', data: { ...TEST_DATA.newUser, phone: TEST_DATA.validUser.phone } },
  { id: 'TC_REG_015', name: 'XSS in Name Field', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter XSS payload in name', 'Complete form'],
    expected: 'Input sanitized, no script execution', data: { ...TEST_DATA.newUser, name: '<script>alert(1)</script>' } },
  { id: 'TC_REG_016', name: 'Very Long Name Input', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter 500+ character name', 'Tap Register'],
    expected: 'Input truncated or error shown', data: { ...TEST_DATA.newUser, name: 'A'.repeat(500) } },
  { id: 'TC_REG_017', name: 'Numeric Only Name', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Enter numeric name like 12345', 'Tap Register'],
    expected: 'Validation error or accepted gracefully', data: { ...TEST_DATA.newUser, name: '12345' } },
  { id: 'TC_REG_018', name: 'Registration UI Elements', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Check all input fields visible'],
    expected: 'Name, Email, OTP, Phone, Address, Role fields all present', data: {} },
  { id: 'TC_REG_019', name: 'Cancel Registration and Go Back', priority: 'P2', module: 'Registration',
    preconditions: 'On registration screen', steps: ['Fill partial form', 'Tap Back/Cancel'],
    expected: 'Returned to login screen, form data cleared', data: {} },
  { id: 'TC_REG_020', name: 'Network Error During Registration', priority: 'P2', module: 'Registration',
    preconditions: 'No network', steps: ['Attempt registration without network'],
    expected: 'Network error shown gracefully', data: TEST_DATA.newUser },
];

// ─────────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT TEST CASES (TC_PROF_001 – TC_PROF_020)
// ─────────────────────────────────────────────────────────────────
const PROFILE_TEST_CASES = [
  { id: 'TC_PROF_001', name: 'View Profile Information', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Navigate to profile section'],
    expected: 'User name, email, phone, address displayed', data: TEST_DATA.validUser },
  { id: 'TC_PROF_002', name: 'Update Profile Name', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in, on profile page', steps: ['Edit name', 'Save'],
    expected: 'Name updated successfully', data: { name: 'Updated Name' } },
  { id: 'TC_PROF_003', name: 'Update Profile Phone', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Edit phone number', 'Save'],
    expected: 'Phone updated', data: { phone: '9999888877' } },
  { id: 'TC_PROF_004', name: 'Update Profile Address', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Edit address', 'Save'],
    expected: 'Address updated', data: { address: 'New Address, City' } },
  { id: 'TC_PROF_005', name: 'Profile Data Persistence', priority: 'P1', module: 'Profile',
    preconditions: 'Profile updated', steps: ['Logout', 'Login again', 'Check profile'],
    expected: 'Updated profile data persists', data: TEST_DATA.validUser },
  { id: 'TC_PROF_006', name: 'Email Cannot Be Changed', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Attempt to edit email field'],
    expected: 'Email field is read-only', data: {} },
  { id: 'TC_PROF_007', name: 'Empty Name in Profile Update', priority: 'P1', module: 'Profile',
    preconditions: 'On profile edit', steps: ['Clear name field', 'Tap Save'],
    expected: 'Validation error: Name cannot be empty', data: { name: '' } },
  { id: 'TC_PROF_008', name: 'Invalid Phone in Profile Update', priority: 'P1', module: 'Profile',
    preconditions: 'On profile edit', steps: ['Enter invalid phone', 'Tap Save'],
    expected: 'Validation error: Invalid phone', data: { phone: '123' } },
  { id: 'TC_PROF_009', name: 'Profile Page UI Elements', priority: 'P2', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Navigate to profile'],
    expected: 'All profile fields visible and properly labeled', data: {} },
  { id: 'TC_PROF_010', name: 'View Wallet Balance on Profile', priority: 'P1', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['Navigate to profile/wallet section'],
    expected: 'Current wallet balance displayed', data: TEST_DATA.validUser },
  { id: 'TC_PROF_011', name: 'Role Display on Profile', priority: 'P2', module: 'Profile',
    preconditions: 'Customer logged in', steps: ['View profile'],
    expected: "User role 'customer' displayed", data: {} },
  { id: 'TC_PROF_012', name: 'Admin Views All Users', priority: 'P0', module: 'Profile',
    preconditions: 'Admin logged in', steps: ['Navigate to Users section'],
    expected: 'All registered users listed', data: TEST_DATA.adminUser },
  { id: 'TC_PROF_013', name: 'Admin User List Shows Role', priority: 'P1', module: 'Profile',
    preconditions: 'Admin logged in, on users list', steps: ['Check each user row'],
    expected: 'Role column shows customer/staff/admin for each user', data: {} },
  { id: 'TC_PROF_014', name: 'Admin Cannot Delete Own Account', priority: 'P1', module: 'Profile',
    preconditions: 'Admin logged in', steps: ['Attempt to delete own account'],
    expected: 'Delete prevented or confirmation required', data: {} },
  { id: 'TC_PROF_015', name: 'Staff Profile View', priority: 'P1', module: 'Profile',
    preconditions: 'Staff logged in', steps: ['Navigate to profile'],
    expected: 'Staff profile information displayed correctly', data: TEST_DATA.staffUser },
  { id: 'TC_PROF_016', name: 'Profile Update Cancel', priority: 'P2', module: 'Profile',
    preconditions: 'On profile edit', steps: ['Edit fields', 'Tap Cancel'],
    expected: 'Changes discarded, original data shown', data: {} },
  { id: 'TC_PROF_017', name: 'XSS in Profile Name Update', priority: 'P2', module: 'Profile',
    preconditions: 'On profile edit', steps: ['Enter XSS payload in name', 'Save'],
    expected: 'Input sanitized, no script execution', data: { name: '<script>alert(1)</script>' } },
  { id: 'TC_PROF_018', name: 'Very Long Address in Profile', priority: 'P2', module: 'Profile',
    preconditions: 'On profile edit', steps: ['Enter 500-char address', 'Save'],
    expected: 'Address truncated or error shown', data: { address: 'A'.repeat(500) } },
  { id: 'TC_PROF_019', name: 'Wallet Balance Reflects Order Payments', priority: 'P1', module: 'Profile',
    preconditions: 'Customer placed order', steps: ['Check wallet balance before and after order'],
    expected: 'Balance decremented by order amount', data: {} },
  { id: 'TC_PROF_020', name: 'Wallet Balance Reflects Topup', priority: 'P1', module: 'Profile',
    preconditions: 'Customer wallet topped up', steps: ['Check wallet balance after topup'],
    expected: 'Balance incremented by topup amount', data: { amount: 100 } },
];

// ─────────────────────────────────────────────────────────────────
// NAVIGATION TEST CASES (TC_NAV_001 – TC_NAV_030)
// ─────────────────────────────────────────────────────────────────
const NAVIGATION_TEST_CASES = Array.from({ length: 30 }, (_, i) => ({
  id: `TC_NAV_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Navigate Customer to Dashboard', 'Navigate Customer to Order History', 'Navigate Customer to Place Order',
    'Navigate Customer to Wallet', 'Navigate Admin to Dashboard', 'Navigate Admin to Orders Management',
    'Navigate Admin to Users Management', 'Navigate Admin to Pricing Settings', 'Navigate Admin to Wallet Transfer',
    'Navigate Staff to Dashboard', 'Navigate Staff to Assigned Orders', 'Navigate Staff to Order Details',
    'Back Button Returns to Previous Screen', 'Hardware Back Button on Home Screen',
    'Deep Link Navigation to Orders', 'Navigation Drawer Open and Close',
    'Tab Navigation Between Sections', 'Bottom Navigation Bar Visibility',
    'Navigation After Session Expired', 'Navigation After Network Error',
    'Navigate to Login from Error State', 'Navigate to Register from Login',
    'Navigate Back from Register to Login', 'Navigate to Forgot Password',
    'Navigate Back from Forgot Password', 'Navigate After Successful Order',
    'Navigate After Wallet Topup', 'Navigate After Staff Action',
    'Navigate Admin to Staff View', 'Navigate Between Multiple Tabs',
  ][i],
  priority: i < 15 ? 'P1' : 'P2',
  module: 'Navigation',
  preconditions: i < 5 ? 'Customer logged in' : i < 10 ? 'Admin logged in' : 'App launched',
  steps: ['Navigate to target section'],
  expected: 'Target screen displayed correctly',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// DASHBOARD TEST CASES (TC_DASH_001 – TC_DASH_020)
// ─────────────────────────────────────────────────────────────────
const DASHBOARD_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_DASH_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Customer Dashboard Shows Order Count', 'Customer Dashboard Shows Wallet Balance',
    'Customer Dashboard Shows Recent Orders', 'Customer Dashboard Empty State (No Orders)',
    'Admin Dashboard Shows Total Orders', 'Admin Dashboard Shows Total Users',
    'Admin Dashboard Shows Total Revenue', 'Admin Dashboard Order Status Summary',
    'Admin Dashboard Shows Staff Count', 'Admin Dashboard Quick Actions',
    'Staff Dashboard Shows Assigned Orders', 'Staff Dashboard Shows Pending Orders',
    'Staff Dashboard Order Accept Action', 'Staff Dashboard Order Reject Action',
    'Dashboard Loads Within 3 Seconds', 'Dashboard Pull-to-Refresh',
    'Dashboard Data Updates in Real Time', 'Dashboard Shows Correct Currency',
    'Dashboard Layout on Small Screen', 'Dashboard Layout on Large Screen',
  ][i],
  priority: i < 10 ? 'P1' : 'P2',
  module: 'Dashboard',
  preconditions: i < 5 ? 'Customer logged in' : i < 10 ? 'Admin logged in' : 'Staff logged in',
  steps: ['Navigate to dashboard', 'Check specified element'],
  expected: 'Element displays correctly',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// ORDERS / CRUD TEST CASES (TC_ORD_001 – TC_ORD_040)
// ─────────────────────────────────────────────────────────────────
const ORDER_TEST_CASES = Array.from({ length: 40 }, (_, i) => ({
  id: `TC_ORD_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Place Order - Standard Wash Cotton', 'Place Order - Dry Cleaning Silk Saree',
    'Place Order - Premium Wash Polyester', 'Place Order - Quick Wash Mixed Fabrics',
    'Place Order with Insufficient Wallet Balance', 'Place Order with Zero Quantity',
    'Place Order with Past Pickup Date', 'Place Order with Future Pickup Date',
    'View All Customer Orders', 'View Order Details',
    'View Order Status History', 'Order Status - Pending',
    'Order Status - Pickup Pending', 'Order Status - Washing',
    'Order Status - Drying', 'Order Status - Ready',
    'Order Status - Delivered', 'Order Status - Rejected',
    'Admin View All Orders', 'Admin Assign Order to Staff',
    'Admin Update Order Status to Washing', 'Admin Update Order Status to Delivered',
    'Admin Reject Order with Refund', 'Admin Filter Orders by Status',
    'Admin Filter Orders by Date', 'Admin Filter Orders by Customer',
    'Staff View Assigned Orders', 'Staff Accept Order',
    'Staff Update Status to Washing', 'Staff Update Status to Drying',
    'Staff Mark Order as Ready', 'Staff Mark Order as Delivered',
    'Order Search by Order ID', 'Order Search by Customer Name',
    'Cancel Order Before Pickup', 'Order Refund on Rejection',
    'Order Price Calculation Accuracy', 'Wallet Deducted on Order',
    'Wallet Refunded on Rejection', 'Admin Wallet Updated on Delivery',
  ][i],
  priority: i < 20 ? 'P0' : 'P1',
  module: 'Orders',
  preconditions: i < 10 ? 'Customer logged in with wallet balance' : i < 20 ? 'Admin logged in' : 'Staff logged in',
  steps: ['Navigate to orders', 'Perform specified action'],
  expected: 'Action completed successfully',
  data: {
    serviceType: TEST_DATA.orders.serviceTypes[i % 4],
    fabricType: TEST_DATA.orders.fabricTypes[i % 5],
    quantity: TEST_DATA.orders.quantities[i % 4],
    pickupDate: TEST_DATA.orders.pickupDates[i % 3],
  },
}));

// ─────────────────────────────────────────────────────────────────
// FORMS TEST CASES (TC_FORM_001 – TC_FORM_040)
// ─────────────────────────────────────────────────────────────────
const FORM_TEST_CASES = Array.from({ length: 40 }, (_, i) => ({
  id: `TC_FORM_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Login Form Submission', 'Login Form Clear on Error', 'Login Form Tab Order',
    'Registration Form Complete', 'Registration Form Partial Submit',
    'Order Form Complete with All Fields', 'Order Form Service Type Dropdown',
    'Order Form Fabric Type Selection', 'Order Form Quantity Input',
    'Order Form Date Picker', 'Order Form Submit with Positive Balance',
    'Order Form Submit with Zero Balance', 'Order Form Error Messages',
    'Wallet Topup Form Valid Amount', 'Wallet Topup Form Invalid Amount',
    'Wallet Topup Form Zero Amount', 'Wallet Topup Form Decimal Amount',
    'Wallet Transfer Form Admin to Staff', 'Wallet Transfer Insufficient Balance',
    'Wallet Transfer Invalid Staff ID', 'Pricing Form Update Base Price',
    'Pricing Form Negative Price', 'Pricing Form Zero Price',
    'Pricing Form Decimal Price', 'OTP Form 6-Digit Input',
    'OTP Form Auto-Submit on Complete', 'OTP Form Delete Character',
    'OTP Form Paste OTP', 'Form Keyboard Type Numeric',
    'Form Keyboard Type Email', 'Form Auto-Capitalize Name',
    'Form Error State Styling', 'Form Success State Styling',
    'Form Loading State', 'Form Timeout Handling',
    'Form Submit on Enter Key', 'Form Scroll on Small Screen',
    'Form Accessibility Labels', 'Form Placeholder Text',
    'Form Character Counter',
  ][i],
  priority: i < 20 ? 'P1' : 'P2',
  module: 'Forms',
  preconditions: 'App running, appropriate user logged in',
  steps: ['Navigate to form', 'Perform specified action'],
  expected: 'Form behaves correctly',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// SEARCH TEST CASES (TC_SRCH_001 – TC_SRCH_020)
// ─────────────────────────────────────────────────────────────────
const SEARCH_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_SRCH_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Search Order by Order ID', 'Search Order by Service Type',
    'Search User by Name', 'Search User by Email',
    'Search with No Results', 'Search with Special Characters',
    'Search Case Insensitive', 'Search with Partial Match',
    'Search Empty Query', 'Search with Spaces',
    'Search Filter by Status', 'Search Filter by Date Range',
    'Search Filter by Role', 'Search Clears on Navigation',
    'Search Results Count', 'Search Results Sort Order',
    'Search with Long Query', 'Search Highlights Matching Text',
    'Search Performance < 1s', 'Search Results Pagination',
  ][i],
  priority: i < 10 ? 'P1' : 'P2',
  module: 'Search',
  preconditions: 'User logged in with existing data',
  steps: ['Navigate to list view', 'Use search functionality'],
  expected: 'Search returns correct results',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// INPUT VALIDATION TEST CASES (TC_VAL_001 – TC_VAL_040)
// ─────────────────────────────────────────────────────────────────
const VALIDATION_TEST_CASES = Array.from({ length: 40 }, (_, i) => ({
  id: `TC_VAL_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Email Field - Missing @ Symbol', 'Email Field - Missing Domain',
    'Email Field - Missing TLD', 'Email Field - Consecutive Dots',
    'Email Field - Leading Dot', 'Email Field - Unicode Characters',
    'Password Field - Minimum Length', 'Password Field - Maximum Length',
    'Password Field - Special Characters', 'Password Field - Unicode',
    'Phone Field - Less Than 10 Digits', 'Phone Field - More Than 15 Digits',
    'Phone Field - Letters in Number', 'Phone Field - Special Characters',
    'Phone Field - Leading Zero', 'Name Field - Numbers Only',
    'Name Field - Special Characters', 'Name Field - Empty',
    'Name Field - Single Character', 'Name Field - Max Length',
    'Amount Field - Negative Value', 'Amount Field - Zero Value',
    'Amount Field - Decimal Two Places', 'Amount Field - String Input',
    'Amount Field - Exceeds Max Balance', 'Quantity Field - Zero',
    'Quantity Field - Negative', 'Quantity Field - Decimal',
    'Quantity Field - Very Large Number', 'Date Field - Past Date',
    'Date Field - Invalid Format', 'Date Field - Future Date Valid',
    'OTP Field - Non-Numeric', 'OTP Field - Less Than 6 Digits',
    'OTP Field - More Than 6 Digits', 'Address Field - Empty',
    'Address Field - Only Spaces', 'Dropdown - No Selection',
    'Multiple Validation Errors Simultaneously', 'Validation Error Clears on Correction',
  ][i],
  priority: 'P1',
  module: 'InputValidation',
  preconditions: 'On relevant form',
  steps: ['Enter invalid input in field', 'Attempt submission'],
  expected: 'Appropriate validation error displayed',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLING TEST CASES (TC_ERR_001 – TC_ERR_020)
// ─────────────────────────────────────────────────────────────────
const ERROR_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_ERR_${String(i + 1).padStart(3, '0')}`,
  name: [
    'API 400 Bad Request Error Display', 'API 401 Unauthorized Error Display',
    'API 403 Forbidden Error Display', 'API 404 Not Found Error Display',
    'API 500 Server Error Display', 'Network Timeout Error',
    'Network Connection Loss Mid-Flow', 'Retry on Network Error',
    'Error Message Dismiss on Tap', 'Error State Clear on Retry',
    'Database Error Graceful Handling', 'Session Expired Error',
    'App Crash Recovery', 'Invalid JSON Response Handling',
    'Empty Response Handling', 'Error on Order Placement',
    'Error on Wallet Topup', 'Error on Profile Update',
    'Error on Status Update', 'Error Boundary UI',
  ][i],
  priority: 'P1',
  module: 'ErrorHandling',
  preconditions: 'User logged in',
  steps: ['Trigger specified error condition'],
  expected: 'Error displayed gracefully without crash',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT TEST CASES (TC_SESS_001 – TC_SESS_020)
// ─────────────────────────────────────────────────────────────────
const SESSION_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_SESS_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Session Stored on Login', 'Session Cleared on Logout',
    'Session Persists on App Restart', 'Session Contains User Role',
    'Session Contains User ID', 'Session Contains User Email',
    'Invalid Session Cannot Access Protected Screens',
    'Session Not Shared Between Users', 'Local Storage Clear on Logout',
    'User Data Cleared on Logout', 'Multiple Login Attempts Session',
    'Session After App Kill', 'Session Integrity Check',
    'Session Data Corruption Handling', 'Session Timeout Behavior',
    'Unauthorized Access Redirect to Login', 'Role-Based Session Redirect',
    'Admin Session vs Customer Session', 'Staff Session Access Rights',
    'Session Token Security',
  ][i],
  priority: 'P1',
  module: 'SessionManagement',
  preconditions: 'App launched',
  steps: ['Perform session-related action'],
  expected: 'Session managed correctly and securely',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// ACCESSIBILITY TEST CASES (TC_ACC_001 – TC_ACC_020)
// ─────────────────────────────────────────────────────────────────
const ACCESSIBILITY_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_ACC_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Screen Reader - Login Screen Labels', 'Screen Reader - Registration Form',
    'Screen Reader - Dashboard Elements', 'Screen Reader - Order Form',
    'Screen Reader - Error Messages', 'Minimum Touch Target Size',
    'Color Contrast Ratio Compliance', 'Text Size Accessibility',
    'Keyboard Navigation Support', 'Focus Indicator Visibility',
    'Image Alt Text', 'Button Accessible Names',
    'Form Field Labels', 'Error Announcement',
    'Navigation Landmarks', 'Heading Hierarchy',
    'Skip Navigation Link', 'Language Attribute Set',
    'Animation Reduced Motion', 'Zoom Support 200%',
  ][i],
  priority: 'P2',
  module: 'Accessibility',
  preconditions: 'App launched',
  steps: ['Enable accessibility service', 'Navigate specified screen'],
  expected: 'Screen reader correctly announces elements',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// PERFORMANCE SMOKE TEST CASES (TC_PERF_001 – TC_PERF_020)
// ─────────────────────────────────────────────────────────────────
const PERFORMANCE_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_PERF_${String(i + 1).padStart(3, '0')}`,
  name: [
    'App Cold Launch < 3 seconds', 'App Warm Launch < 1.5 seconds',
    'Login API Response < 2 seconds', 'Dashboard Load < 2 seconds',
    'Order List Load < 2 seconds', 'Place Order API < 3 seconds',
    'Wallet Topup API < 2 seconds', 'OTP Send API < 3 seconds',
    'Profile Load < 1 second', 'User List Load (Admin) < 2 seconds',
    'App Memory Usage < 150 MB', 'App CPU Usage < 30% during idle',
    'No Memory Leak After 10 Operations', 'Frame Rate > 60fps on Scroll',
    'Image Loading < 1 second', 'Animation Smooth 60fps',
    'Network Timeout After 30 seconds', 'Concurrent API Requests Handle',
    'Large Order List Scroll Performance', 'Battery Drain Normal Usage',
  ][i],
  priority: 'P1',
  module: 'Performance',
  preconditions: 'App launched, device profiler active',
  steps: ['Perform specified action', 'Measure performance metric'],
  expected: 'Performance within acceptable threshold',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// REGRESSION TEST CASES (TC_REG2_001 – TC_REG2_050)
// ─────────────────────────────────────────────────────────────────
const REGRESSION_TEST_CASES = Array.from({ length: 50 }, (_, i) => ({
  id: `TC_REGR_${String(i + 1).padStart(3, '0')}`,
  name: `Regression - ${[
    'Full Login to Order Flow', 'Full Registration to Order Flow',
    'Admin Order Assignment End-to-End', 'Staff Order Delivery End-to-End',
    'Wallet Topup and Order Payment', 'Admin Wallet Transfer to Staff',
    'Order Rejection with Wallet Refund', 'Multi-Role Login Switch',
    'Password Reset Full Flow', 'Order Status Lifecycle',
    'Customer Places Multiple Orders', 'Admin Manages Multiple Staff',
    'Staff Handles Multiple Orders', 'Wallet Balance Accuracy',
    'Price Calculation Accuracy', 'Session Handling Under Load',
    'Error Recovery Full Flow', 'Navigation Full Regression',
    'Form Validation Full Regression', 'API Error Handling Full Regression',
    'Login Screen After App Update', 'Data Sync After Network Recovery',
    'Concurrent Order Placement', 'Admin Update Pricing Impact',
    'Role-Based UI Elements', 'Order Date Filter Accuracy',
    'User Search Functionality', 'Order Search Functionality',
    'Wallet History Display', 'Order History Display',
    'Admin Analytics Accuracy', 'Staff Performance Metrics',
    'Customer Order Notifications', 'Admin System Notifications',
    'App Stability 100 Orders', 'Database Consistency Check',
    'API Response Data Accuracy', 'UI State After Background',
    'App Memory After 30 Minutes', 'Screen Rotation Handling',
    'Dark Mode Support', 'Light Mode Support',
    'Landscape Orientation', 'Portrait Orientation',
    'Small Screen (4 inch) Layout', 'Large Screen (6.5 inch) Layout',
    'Tablet Layout', 'Accessibility Full Regression',
    'Security Full Regression', 'Performance Full Regression',
  ][i]}`,
  priority: 'P0',
  module: 'Regression',
  preconditions: 'Clean app state',
  steps: ['Execute full regression scenario'],
  expected: 'All components working as designed',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS TEST CASES (TC_NOTIF_001 – TC_NOTIF_020)
// ─────────────────────────────────────────────────────────────────
const NOTIFICATION_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_NOTIF_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Push Notification Permission Request', 'Push Notification on Order Placed',
    'Push Notification on Order Assigned', 'Push Notification on Order Status Update',
    'Push Notification on Order Delivered', 'Push Notification on Order Rejected',
    'Push Notification on Wallet Topup', 'Push Notification on Wallet Transfer',
    'Notification Badge Count', 'Notification Opens App',
    'Notification Opens Correct Screen', 'In-App Notification Toast',
    'Notification Cleared After Read', 'Notification History',
    'Email Notification on OTP Send', 'Notification Permission Denied Handling',
    'Silent Notification Support', 'Notification on Background',
    'Notification on App Kill', 'Notification Rate Limiting',
  ][i],
  priority: i < 10 ? 'P1' : 'P2',
  module: 'Notifications',
  preconditions: 'User logged in, notifications enabled',
  steps: ['Trigger notification event'],
  expected: 'Notification received and displayed correctly',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// OFFLINE HANDLING TEST CASES (TC_OFF_001 – TC_OFF_010)
// ─────────────────────────────────────────────────────────────────
const OFFLINE_TEST_CASES = Array.from({ length: 10 }, (_, i) => ({
  id: `TC_OFF_${String(i + 1).padStart(3, '0')}`,
  name: [
    'App Launch Without Network', 'Login Attempt Without Network',
    'Dashboard Load Without Network', 'Cached Data Displayed Offline',
    'Error Message When Offline', 'Auto-Retry on Network Recovery',
    'Offline State Indicator in UI', 'Order Placement Fails Gracefully Offline',
    'Wallet Topup Fails Gracefully Offline', 'Profile Load Fails Gracefully Offline',
  ][i],
  priority: 'P2',
  module: 'OfflineHandling',
  preconditions: 'Network disabled (airplane mode)',
  steps: ['Perform action with no network'],
  expected: 'App handles offline gracefully with appropriate messaging',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// RESPONSIVE UI TEST CASES (TC_RESP_001 – TC_RESP_010)
// ─────────────────────────────────────────────────────────────────
const RESPONSIVE_TEST_CASES = Array.from({ length: 10 }, (_, i) => ({
  id: `TC_RESP_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Login Screen on HDPI Device', 'Login Screen on LDPI Device',
    'Dashboard Layout on Small Screen', 'Dashboard Layout on Large Screen',
    'Order Form Scrollable on Small Screen', 'Lists Scroll Correctly',
    'Text Truncation on Narrow Screen', 'Buttons Remain Tappable on All Screens',
    'Images Scale Correctly', 'App Handles Screen Rotation',
  ][i],
  priority: 'P2',
  module: 'ResponsiveUI',
  preconditions: 'App running on target device',
  steps: ['Navigate to specified screen', 'Check layout responsiveness'],
  expected: 'Layout adapts correctly to screen size',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// AUTHORIZATION TEST CASES (TC_AUTHZ_001 – TC_AUTHZ_030)
// ─────────────────────────────────────────────────────────────────
const AUTHORIZATION_TEST_CASES = Array.from({ length: 30 }, (_, i) => ({
  id: `TC_AUTHZ_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Customer Cannot Place Admin Action', 'Customer Cannot View All Users',
    'Customer Cannot Update Pricing', 'Customer Cannot Assign Staff to Order',
    'Customer Cannot Access Staff Dashboard', 'Staff Cannot View All Customers',
    'Staff Cannot Modify Pricing', 'Staff Cannot Transfer Wallet to Other Staff',
    'Staff Can Only View Assigned Orders', 'Staff Cannot Reject Orders for Other Staff',
    'Admin Can View All Orders', 'Admin Can Assign Any Order',
    'Admin Can Update Pricing', 'Admin Can Transfer Wallet',
    'Admin Can View All Users', 'Unauthenticated User Cannot Access Dashboard',
    'Unauthenticated User Redirected to Login', 'Role in Session Token Validated',
    'IDOR – Customer Cannot View Other Customer Orders',
    'IDOR – Customer Cannot Modify Other Customer Orders',
    'Admin Can Delete/Reject Any Order', 'Admin Cannot Impersonate Other Users',
    'Staff Session Cannot Perform Admin Actions',
    'Horizontal Privilege Escalation Prevented',
    'Vertical Privilege Escalation Prevented',
    'JWT Token Role Tampering Prevented',
    'API Endpoints Protected by Role',
    'Feature Flags Correctly Hide Admin UI from Customer',
    'Role-Based Menu Items Visible Correctly',
    'Unauthorized API Response Returns 401/403',
  ][i],
  priority: i < 10 ? 'P0' : 'P1',
  module: 'Authorization',
  preconditions: 'User logged in with specified role',
  steps: ['Attempt action not permitted for user role'],
  expected: 'Action denied with appropriate error',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// FILTERS TEST CASES (TC_FILT_001 – TC_FILT_020)
// ─────────────────────────────────────────────────────────────────
const FILTER_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_FILT_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Filter Orders by Status - Pending', 'Filter Orders by Status - Delivered',
    'Filter Orders by Status - Rejected', 'Filter Orders by Status - Washing',
    'Filter Orders by Date - Today', 'Filter Orders by Date - Last 7 Days',
    'Filter Orders by Date - Last 30 Days', 'Filter Orders by Service Type',
    'Filter Orders by Fabric Type', 'Filter Users by Role - Customer',
    'Filter Users by Role - Staff', 'Filter Users by Role - Admin',
    'Filter Clears Correctly', 'Filter with No Results',
    'Multiple Filters Combined', 'Filter Persists on Navigation Back',
    'Filter Count Badge', 'Filter Reset to Default',
    'Filter Applied Indicator', 'Filter Dropdown Opens Correctly',
  ][i],
  priority: 'P1',
  module: 'Filters',
  preconditions: 'User logged in with existing data',
  steps: ['Apply specified filter'],
  expected: 'Filtered results match criteria',
  data: {},
}));

// ─────────────────────────────────────────────────────────────────
// WALLET / PAYMENT TEST CASES (TC_WALL_001 – TC_WALL_020)
// ─────────────────────────────────────────────────────────────────
const WALLET_TEST_CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `TC_WALL_${String(i + 1).padStart(3, '0')}`,
  name: [
    'Customer View Wallet Balance', 'Customer Topup Wallet - Valid Amount',
    'Customer Topup Wallet - Zero Amount', 'Customer Topup Wallet - Negative Amount',
    'Customer Topup Wallet - Large Amount', 'Wallet Balance Updates After Topup',
    'Order Payment Deducts Wallet', 'Insufficient Balance Blocks Order',
    'Wallet Balance After Order Rejection Refund', 'Admin Wallet Balance Display',
    'Admin Transfer Wallet to Staff', 'Admin Transfer with Insufficient Balance',
    'Admin Transfer Zero Amount', 'Admin Transfer Invalid Staff ID',
    'Admin Wallet Updated After Delivery', 'Staff Wallet Balance Display',
    'Staff Receives Wallet Transfer', 'Wallet History Display',
    'Wallet Decimal Accuracy', 'Wallet Concurrent Operations',
  ][i],
  priority: i < 10 ? 'P0' : 'P1',
  module: 'Wallet',
  preconditions: 'User logged in',
  steps: ['Navigate to wallet section', 'Perform specified action'],
  expected: 'Wallet operation completes correctly',
  data: { amount: TEST_DATA.wallet.topupAmount },
}));

// ─────────────────────────────────────────────────────────────────
// Aggregate ALL Test Cases
// ─────────────────────────────────────────────────────────────────
const ALL_TEST_CASES = [
  ...AUTH_TEST_CASES,          // 40
  ...AUTHORIZATION_TEST_CASES, // 30
  ...REGISTRATION_TEST_CASES,  // 20
  ...PROFILE_TEST_CASES,       // 20
  ...NAVIGATION_TEST_CASES,    // 30
  ...DASHBOARD_TEST_CASES,     // 20
  ...FORM_TEST_CASES,          // 40
  ...ORDER_TEST_CASES,         // 40
  ...SEARCH_TEST_CASES,        // 20
  ...FILTER_TEST_CASES,        // 20
  ...VALIDATION_TEST_CASES,    // 40
  ...ERROR_TEST_CASES,         // 20
  ...SESSION_TEST_CASES,       // 20
  ...NOTIFICATION_TEST_CASES,  // 20
  ...OFFLINE_TEST_CASES,       // 10
  ...ACCESSIBILITY_TEST_CASES, // 20
  ...RESPONSIVE_TEST_CASES,    // 10
  ...PERFORMANCE_TEST_CASES,   // 20
  ...WALLET_TEST_CASES,        // 20
  ...REGRESSION_TEST_CASES,    // 50
  // Total: 530 test cases
];

module.exports = {
  ALL_TEST_CASES,
  TEST_DATA,
  AUTH_TEST_CASES,
  AUTHORIZATION_TEST_CASES,
  REGISTRATION_TEST_CASES,
  PROFILE_TEST_CASES,
  NAVIGATION_TEST_CASES,
  DASHBOARD_TEST_CASES,
  FORM_TEST_CASES,
  ORDER_TEST_CASES,
  SEARCH_TEST_CASES,
  FILTER_TEST_CASES,
  VALIDATION_TEST_CASES,
  ERROR_TEST_CASES,
  SESSION_TEST_CASES,
  NOTIFICATION_TEST_CASES,
  OFFLINE_TEST_CASES,
  ACCESSIBILITY_TEST_CASES,
  RESPONSIVE_TEST_CASES,
  PERFORMANCE_TEST_CASES,
  WALLET_TEST_CASES,
  REGRESSION_TEST_CASES,
};
