// ================= STATE MANAGEMENT =================
let currentUser = null;
let basePrice = 2.00;
let selectedService = "Standard Wash";
let activeOrders = [];
let allOrders = []; // For Admin
let qrCodeInstance = null;

// Service pricing multipliers
const SERVICE_MULTIPLIERS = {
    "Standard Wash": 1.0,
    "Dry Cleaning": 1.5,
    "Iron / Press": 0.8,
    "Express Wash": 1.8
};

// ================= DOM ELEMENT BINDINGS =================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    bindEvents();
});

function initApp() {
    // Check if user session is saved in LocalStorage
    const savedUser = localStorage.getItem('laundry_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboardByRole(currentUser.role);
    } else {
        showSect("sectAuth");
    }
    fetchBasePrice();
}

// Fetch Global Pricing Rate
async function fetchBasePrice() {
    try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        basePrice = data.basePrice || 2.00;
        
        // Populate Admin inputs if active
        const adminInput = document.getElementById('adminBasePriceInput');
        if (adminInput) adminInput.value = basePrice.toFixed(2);
        
        recalculateBookingPrice();
    } catch (e) {
        console.error('Failed to load base price rates:', e);
    }
}

// Set Active Visible Section
function showSect(sectId) {
    document.querySelectorAll('.sect-container').forEach(s => s.style.display = 'none');
    document.getElementById(sectId).style.display = 'block';
    
    // Header controls
    const header = document.getElementById('mainHeader');
    if (sectId === 'sectAuth') {
        header.style.display = 'none';
    } else {
        header.style.display = 'block';
        document.getElementById('navUserName').innerText = currentUser.name;
        document.getElementById('navUserBadge').innerText = currentUser.role;
    }
}

// Direct routing based on roles
function showDashboardByRole(role) {
    if (role === 'admin') {
        showSect("sectAdmin");
        loadAdminDashboard();
    } else if (role === 'staff') {
        showSect("sectStaff");
        loadStaffDashboard();
    } else {
        showSect("sectCustomer");
        loadCustomerDashboard();
    }
}

// ================= EVENT LISTENER BINDINGS =================
function bindEvents() {
    // Auth Tabs toggles
    document.getElementById('tabLogin').addEventListener('click', () => toggleAuthTab('login'));
    document.getElementById('tabRegister').addEventListener('click', () => toggleAuthTab('register'));

    // Submit actions
    document.getElementById('submitLogin').addEventListener('click', handleLogin);
    document.getElementById('submitRegister').addEventListener('click', handleRegisterReqOtp);
    document.getElementById('btnLogOut').addEventListener('click', handleLogout);

    // Forgot Password Flow
    document.getElementById('linkForgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('formLogin').style.display = 'none';
        document.getElementById('formForgotPassword').style.display = 'block';
    });
    document.getElementById('btnCancelForgot').addEventListener('click', () => {
        document.getElementById('formForgotPassword').style.display = 'none';
        document.getElementById('formLogin').style.display = 'block';
    });
    document.getElementById('btnSendForgotOtp').addEventListener('click', handleForgotSendOtp);
    document.getElementById('btnResetPassword').addEventListener('click', handleForgotResetPass);

    // Registration OTP Verification Flow
    document.getElementById('btnVerifyRegOtp').addEventListener('click', handleRegisterVerify);
    document.getElementById('btnCancelRegOtp').addEventListener('click', () => {
        document.getElementById('regOtpModal').style.display = 'none';
        document.getElementById('overlayRegOtp').style.display = 'none';
    });

    // Customer Service Chips selection
    document.querySelectorAll('.service-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.service-chip').forEach(c => c.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            selectedService = target.getAttribute('data-service');
            recalculateBookingPrice();
        });
    });

    // Fabric Input watcher for AI Recommendations
    document.getElementById('custFabricInput').addEventListener('input', handleFabricAIRecommend);

    // Quantity watcher for pricing calculations
    document.getElementById('custQtyInput').addEventListener('input', recalculateBookingPrice);

    // Confirm booking checkout
    document.getElementById('btnSubmitBooking').addEventListener('click', handlePlaceBooking);

    // Timeline toggles
    document.getElementById('btnShowTimeline').addEventListener('click', () => toggleCustomerTimeline(true));
    document.getElementById('btnBackToHistory').addEventListener('click', () => toggleCustomerTimeline(false));

    // Staff Scanner simulation
    document.getElementById('btnShowTimeline').addEventListener('click', () => toggleCustomerTimeline(true));
    document.getElementById('btnBackToHistory').addEventListener('click', () => toggleCustomerTimeline(false));

    // Staff Scanner simulation
    document.getElementById('btnStaffSimScan').addEventListener('click', handleStaffScanQR);

    // Admin pricing updates
    document.getElementById('btnAdminApplyPrice').addEventListener('click', handleAdminUpdatePrice);
}

function toggleAuthTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('formForgotPassword').style.display = 'none';
    
    if (type === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('formLogin').style.display = 'block';
        document.getElementById('formRegister').style.display = 'none';
    } else {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('formLogin').style.display = 'none';
        document.getElementById('formRegister').style.display = 'block';
    }
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconElement.classList.remove("fa-eye-slash");
        iconElement.classList.add("fa-eye");
    } else {
        input.type = "password";
        iconElement.classList.remove("fa-eye");
        iconElement.classList.add("fa-eye-slash");
    }
}

// ================= AUTHENTICATION ACTIONS =================
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('laundry_user', JSON.stringify(currentUser));
            showDashboardByRole(currentUser.role);
        } else {
            alert(data.message || "Invalid credentials");
        }
    } catch (e) {
        alert("Failed to connect to localhost server.");
    }
}

// Globals to hold reg data temporarily
let pendingRegData = null;

async function handleRegisterReqOtp() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const role = document.querySelector('input[name="regRole"]:checked').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !phone || !address || !password) {
        alert("Please fill in all registration parameters.");
        return;
    }

    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    pendingRegData = { name, email, password, phone, address, role };

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, purpose: 'registration' })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('overlayRegOtp').style.display = 'block';
            document.getElementById('regOtpModal').style.display = 'block';
        } else {
            alert(data.message || "Failed to send OTP.");
        }
    } catch (e) {
        alert("Connection to server failed.");
    }
}

async function handleRegisterVerify() {
    if (!pendingRegData) return;
    const otpCode = document.getElementById('regOtpInput').value.trim();
    
    if (otpCode.length !== 6) {
        alert("Please enter the 6-digit OTP");
        return;
    }

    pendingRegData.otp_code = otpCode;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingRegData)
        });
        const data = await res.json();
        
        if (data.success) {
            alert("Registration successful! Email verified.");
            document.getElementById('regOtpModal').style.display = 'none';
            document.getElementById('overlayRegOtp').style.display = 'none';
            document.getElementById('regOtpInput').value = '';
            
            // Clear inputs
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPhone').value = '';
            document.getElementById('regAddress').value = '';
            document.getElementById('regPassword').value = '';
            
            // Switch to login
            toggleAuthTab('login');
        } else {
            alert(data.message || "Registration failed or invalid OTP.");
        }
    } catch (e) {
        alert("Failed to verify registration.");
    }
}

async function handleForgotSendOtp() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
        alert("Please enter your email."); return;
    }
    
    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, purpose: 'password_reset' })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('forgotStep1').style.display = 'none';
            document.getElementById('forgotStep2').style.display = 'block';
        } else {
            alert(data.message || "Failed to send reset code.");
        }
    } catch(e) {
        alert("Server error.");
    }
}

async function handleForgotResetPass() {
    const email = document.getElementById('forgotEmail').value.trim();
    const otp_code = document.getElementById('forgotOtp').value.trim();
    const new_password = document.getElementById('forgotNewPassword').value.trim();
    
    if (!otp_code || !new_password) {
        alert("Please enter the OTP and new password."); return;
    }
    if (new_password.length < 6) {
        alert("Password must be at least 6 characters."); return;
    }

    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp_code, new_password })
        });
        const data = await res.json();
        if (data.success) {
            alert("Password reset successfully! You can now log in.");
            document.getElementById('forgotStep2').style.display = 'none';
            document.getElementById('forgotStep1').style.display = 'block';
            document.getElementById('formForgotPassword').style.display = 'none';
            document.getElementById('formLogin').style.display = 'block';
            
            document.getElementById('forgotOtp').value = '';
            document.getElementById('forgotNewPassword').value = '';
            document.getElementById('forgotEmail').value = '';
        } else {
            alert(data.message || "Invalid OTP.");
        }
    } catch(e) {
        alert("Server error.");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('laundry_user');
    showSect("sectAuth");
}

// ================= CUSTOMER DASHBOARD CONTROLS =================
async function loadCustomerDashboard() {
    document.getElementById('custGreeting').innerText = `Welcome back, ${currentUser.name}!`;
    
    // Set default pickup date tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('custDateInput').value = tomorrow.toISOString().substring(0, 10);
    
    loadCustomerOrders();
    startCustomerPolling();
}

let customerInterval = null;
function startCustomerPolling() {
    if (customerInterval) clearInterval(customerInterval);
    customerInterval = setInterval(loadCustomerOrders, 3000); // Poll every 3 seconds for sync!
}

async function loadCustomerOrders() {
    try {
        const res = await fetch(`/api/orders?userId=${currentUser.userId}`);
        activeOrders = await res.json();
        
        // Render Active Status Card
        const activeOrder = activeOrders.find(o => o.status !== "Delivered");
        const activeCard = document.getElementById('cardCustActiveOrder');
        
        if (activeOrder) {
            activeCard.style.display = 'block';
            document.getElementById('custActiveStatusTag').innerText = activeOrder.status;
            document.getElementById('custActiveStatusTag').className = `status-badge status-${activeOrder.status.toLowerCase().replace(/\s+/g, '-')}`;
            document.getElementById('custActiveEstDelivery').innerText = `Estimated Pickup/Delivery: ${activeOrder.pickupDate}`;
            document.getElementById('custActiveDetails').innerText = `Service: ${activeOrder.serviceType} | Quantity: ${activeOrder.totalQuantity} items | Total: ₹${activeOrder.totalPrice.toFixed(2)}`;
            
            // Set tracking order details
            updateTrackingTimeline(activeOrder);
        } else {
            activeCard.style.display = 'none';
        }
        
        renderHistoryList(activeOrders);
    } catch (e) {
        console.error('Failed to load customer history:', e);
    }
}

// Recalculate price dynamically
function recalculateBookingPrice() {
    const qty = parseInt(document.getElementById('custQtyInput').value) || 1;
    const mult = SERVICE_MULTIPLIERS[selectedService] || 1.0;
    const cost = qty * basePrice * mult;
    document.getElementById('custEstimatedPrice').innerText = `₹${cost.toFixed(2)}`;
}

// AI recommendation rule engine
function handleFabricAIRecommend(e) {
    const text = e.target.value.toLowerCase().trim();
    const alertBox = document.getElementById('custAIAlert');
    const alertBody = document.getElementById('custAIAlertBody');

    if (text.length === 0) {
        alertBox.style.display = 'none';
        return;
    }

    alertBox.style.display = 'block';
    if (text.includes("silk") || text.includes("saree") || text.includes("delicate")) {
        alertBody.innerText = "💡 Delicate fabric detected. Recommended: Hand-Wash Cool or Premium Dry Cleaning. Prevents shrinkage.";
    } else if (text.includes("wool") || text.includes("sweater")) {
        alertBody.innerText = "💡 Wool fibers detected. Recommended: Cold water gentle cycle, flat air-dry only.";
    } else if (text.includes("jean") || text.includes("denim")) {
        alertBody.innerText = "💡 Heavy canvas denim. Recommended: Heavy Duty Spin cycle, safe with softeners.";
    } else {
        alertBody.innerText = "💡 Standard cotton blend. Recommended: Normal Hot Water cycle, standard Tumble Dry.";
    }
}

async function handlePlaceBooking() {
    const fabric = document.getElementById('custFabricInput').value.trim();
    const qty = parseInt(document.getElementById('custQtyInput').value) || 1;
    const pickupDate = document.getElementById('custDateInput').value;

    if (!fabric || !pickupDate) {
        alert("Please enter fabric description and select a pickup date!");
        return;
    }

    const mult = SERVICE_MULTIPLIERS[selectedService] || 1.0;
    const cost = qty * basePrice * mult;

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                serviceType: selectedService,
                fabricType: fabric,
                totalQuantity: qty,
                pickupDate,
                totalPrice: cost
            })
        });
        const data = await res.json();
        
        if (data.success) {
            alert("Booking placed successfully!");
            document.getElementById('custFabricInput').value = '';
            document.getElementById('custQtyInput').value = 1;
            loadCustomerOrders();
        } else {
            alert("Failed to place booking");
        }
    } catch (e) {
        alert("Connection to localhost backend failed.");
    }
}

function toggleCustomerTimeline(show) {
    if (show) {
        document.getElementById('panelBookingHistory').style.display = 'none';
        document.getElementById('panelTrackingTimeline').style.display = 'block';
    } else {
        document.getElementById('panelBookingHistory').style.display = 'block';
        document.getElementById('panelTrackingTimeline').style.display = 'none';
    }
}

function updateTrackingTimeline(order) {
    const steps = ["Pickup Pending", "Picked Up", "Washing", "Ironing", "Ready", "Delivered"];
    const currentIdx = steps.indexOf(order.status);

    steps.forEach((step, idx) => {
        const item = document.getElementById(`tl_step${idx + 1}`);
        item.className = 'timeline-item'; // Reset
        
        if (idx < currentIdx) {
            item.classList.add('completed');
        } else if (idx === currentIdx) {
            item.classList.add('current');
        }
    });

    // Render QR Code in placeholder
    const qrCanvas = document.getElementById('custQrCanvas');
    qrCanvas.innerHTML = ''; // Clear previous
    
    if (order.status !== "Delivered") {
        qrCodeInstance = new QRCode(qrCanvas, {
            text: order.orderId,
            width: 120,
            height: 120
        });
    } else {
        qrCanvas.innerHTML = '<span class="text-accent"><i class="fa-solid fa-circle-check"></i> Delivered</span>';
    }
}

function renderHistoryList(orders) {
    const list = document.getElementById('custHistoryList');
    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No bookings found. Place a wash request above!</p>
            </div>`;
        return;
    }

    orders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'order-item-card';
        card.innerHTML = `
            <div class="order-item-header">
                <h4>Order #${o.orderId.takeShort()}</h4>
                <span class="status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}" style="font-size: 8px;">${o.status}</span>
            </div>
            <div class="order-item-body">
                <div class="order-meta-info">
                    <p><b>Service:</b> ${o.serviceType} (${o.totalQuantity} items)</p>
                    <p><b>Fabric:</b> ${o.fabricType}</p>
                    <p><b>Scheduled Date:</b> ${o.pickupDate} | Placed: ${date}</p>
                </div>
                <div class="order-price-info">
                    <p class="cost">₹${o.totalPrice.toFixed(2)}</p>
                    <p class="payment" style="color: ${o.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B'}">${o.paymentStatus}</p>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            toggleCustomerTimeline(true);
            updateTrackingTimeline(o);
        });
        list.appendChild(card);
    });
}

String.prototype.takeShort = function() {
    return this.replace('ord_', '').toUpperCase().substring(0, 6);
};

// ================= LAUNDRY STAFF MODULE CONTROLS =================
async function loadStaffDashboard() {
    document.getElementById('staffGreeting').innerText = `Hello, ${currentUser.name}!`;
    loadStaffOrders();
    startStaffPolling();
}

let staffInterval = null;
function startStaffPolling() {
    if (staffInterval) clearInterval(staffInterval);
    staffInterval = setInterval(loadStaffOrders, 3000); // Poll every 3 seconds for sync!
}

async function loadStaffOrders() {
    try {
        const res = await fetch(`/api/orders?staffId=${currentUser.userId}`);
        const orders = await res.json();
        renderStaffWorkload(orders);
    } catch (e) {
        console.error('Failed to load staff workload:', e);
    }
}

function renderStaffWorkload(orders) {
    const list = document.getElementById('staffWorkloadList');
    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-list-check"></i>
                <p>No active orders in the queue. You are all caught up!</p>
            </div>`;
        return;
    }

    orders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-item-card';
        
        const isDelivered = o.status === 'Delivered';
        const buttonText = getNextStageButtonText(o.status);

        card.innerHTML = `
            <div class="order-item-header">
                <h4>Order #${o.orderId.takeShort()}</h4>
                <span class="status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
            </div>
            <div class="order-item-body">
                <div class="order-meta-info">
                    <p><b>Service:</b> ${o.serviceType} | <b>Quantity:</b> ${o.totalQuantity} items</p>
                    <p><b>Details:</b> ${o.fabricType}</p>
                    <p><b>Scheduled:</b> ${o.pickupDate}</p>
                </div>
                <div>
                    ${isDelivered ? '' : `<button class="btn-secondary btn-sm btn-advance-status" data-id="${o.orderId}">${buttonText}</button>`}
                </div>
            </div>
        `;
        
        const btn = card.querySelector('.btn-advance-status');
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await handleAdvanceStage(o);
            });
        }

        list.appendChild(card);
    });
}

function getNextStageButtonText(status) {
    switch (status) {
        case "Pickup Pending": return "Mark Picked Up";
        case "Picked Up":      return "Start Washing";
        case "Washing":        return "Start Ironing";
        case "Ironing":        return "Mark Ready";
        case "Ready":          return "Dispatch / Dropoff";
        default: return "Complete";
    }
}

async function handleAdvanceStage(order) {
    const steps = ["Pickup Pending", "Picked Up", "Washing", "Ironing", "Ready", "Delivered"];
    const currentIdx = steps.indexOf(order.status);
    const nextStatus = steps[currentIdx + 1] || order.status;

    try {
        const res = await fetch(`/api/orders/${order.orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: nextStatus,
                staffId: currentUser.userId
            })
        });
        const data = await res.json();
        if (data.success) {
            loadStaffOrders();
        }
    } catch (e) {
        alert("Failed to advance stage.");
    }
}

// Simulated QR validation action
async function handleStaffScanQR() {
    const orderId = document.getElementById('staffQrSimInput').value.trim();
    if (!orderId) {
        alert("Please paste a Customer's Order ID to verify.");
        return;
    }

    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: "Delivered",
                staffId: currentUser.userId
            })
        });
        const data = await res.json();
        
        if (data.success) {
            alert(`Validation successful! Order #${orderId.takeShort()} marked DELIVERED and marked PAID.`);
            document.getElementById('staffQrSimInput').value = '';
            loadStaffOrders();
        } else {
            alert("Invalid Order ID. Check the active code!");
        }
    } catch (e) {
        alert("Connection to localhost backend failed.");
    }
}

// ================= ADMIN MODULE CONTROLS =================
function toggleAdminView(viewId) {
    document.getElementById('adminOverview').style.display = 'none';
    document.getElementById('adminTasks').style.display = 'none';
    document.getElementById('adminUsers').style.display = 'none';
    
    document.getElementById(viewId).style.display = 'block';
    
    document.querySelectorAll('.btn-sidebar').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (viewId === 'adminUsers') {
        loadAdminUsers();
    }
}

async function loadAdminDashboard() {
    document.getElementById('adminGreeting').innerText = `Central Admin: ${currentUser.name}`;
    loadAdminOrders();
    loadAdminUsers();
    fetchBasePrice(); // Refreshes pricing rates inputs
    startAdminPolling();
}

let adminInterval = null;
function startAdminPolling() {
    if (adminInterval) clearInterval(adminInterval);
    adminInterval = setInterval(loadAdminOrders, 5000); // Poll every 5 seconds!
}

async function loadAdminOrders() {
    try {
        const res = await fetch('/api/orders');
        allOrders = await res.json();
        
        // Render Metric summaries
        calculateAdminMetrics(allOrders);
        renderAdminAllOrders(allOrders);
    } catch (e) {
        console.error('Failed to load admin stats:', e);
    }
}

function calculateAdminMetrics(orders) {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.totalPrice : 0.00), 0.00);
    const activeOrders = orders.filter(o => o.status !== 'Delivered').length;

    document.getElementById('adminRevenueMetric').innerText = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('adminActiveCountMetric').innerText = `${activeOrders} Active`;
}

async function loadAdminUsers() {
    try {
        const res = await fetch('/api/users');
        const users = await res.json();
        renderAdminUsers(users);
        document.getElementById('adminUsersCountMetric').innerText = `${users.length} Users`;
    } catch (e) {
        console.error('Failed to load admin users:', e);
    }
}

function renderAdminUsers(users) {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    list.innerHTML = '';
    
    users.forEach(u => {
        const card = document.createElement('div');
        card.className = 'order-item-card';
        card.innerHTML = `
            <div class="order-item-header">
                <h4>${u.name}</h4>
                <span class="status-badge" style="background-color: var(--primary);">${u.role.toUpperCase()}</span>
            </div>
            <div class="order-item-body">
                <div class="order-meta-info">
                    <p><b>Email:</b> ${u.email}</p>
                    <p><b>Phone:</b> ${u.phone}</p>
                    <p><b>Address:</b> ${u.address}</p>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderAdminAllOrders(orders) {
    const list = document.getElementById('adminAllOrdersList');
    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No bookings have been placed across the platform yet.</p>
            </div>`;
        return;
    }

    orders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'order-item-card';
        card.innerHTML = `
            <div class="order-item-header">
                <h4>Order #${o.orderId.takeShort()}</h4>
                <span class="status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
            </div>
            <div class="order-item-body">
                <div class="order-meta-info">
                    <p><b>Service:</b> ${o.serviceType} | <b>Quantity:</b> ${o.totalQuantity} items</p>
                    <p><b>Fabric:</b> ${o.fabricType} | <b>Date:</b> ${o.pickupDate} (${date})</p>
                    <p><b>Assigned Agent:</b> ${o.assignedStaffId ? 'Staff #' + o.assignedStaffId.takeShort() : '<span style="color:#EF4444;">Unassigned</span>'}</p>
                </div>
                <div class="order-price-info" style="text-align: right;">
                    <p class="cost">₹${o.totalPrice.toFixed(2)}</p>
                    <p class="payment" style="color: ${o.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B'}">${o.paymentStatus}</p>
                    <div style="margin-top: 10px;">
                        <select onchange="adminChangeOrderStatus('${o.orderId}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border); font-size: 11px;">
                            <option value="Pickup Pending" ${o.status === 'Pickup Pending' ? 'selected' : ''}>Pickup Pending</option>
                            <option value="Picked Up" ${o.status === 'Picked Up' ? 'selected' : ''}>Picked Up</option>
                            <option value="Washing" ${o.status === 'Washing' ? 'selected' : ''}>Washing</option>
                            <option value="Ironing" ${o.status === 'Ironing' ? 'selected' : ''}>Ironing</option>
                            <option value="Ready" ${o.status === 'Ready' ? 'selected' : ''}>Ready</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function adminChangeOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, staffId: currentUser.userId })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminOrders();
        }
    } catch (e) {
        alert("Failed to update status.");
    }
}

// Update Base piece price rates
async function handleAdminUpdatePrice() {
    const priceVal = parseFloat(document.getElementById('adminBasePriceInput').value);
    if (!priceVal || priceVal <= 0) {
        alert("Please enter a valid positive base price.");
        return;
    }

    try {
        const res = await fetch('/api/pricing', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ basePrice: priceVal })
        });
        const data = await res.json();
        
        if (data.success) {
            alert("Global base laundry price rates updated successfully in server database!");
            basePrice = priceVal;
        } else {
            alert("Failed to adjust price configuration.");
        }
    } catch (e) {
        alert("Connection to localhost server failed.");
    }
}
