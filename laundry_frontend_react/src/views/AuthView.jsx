import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Camera, 
  CheckCircle2, AlertCircle, ArrowLeft, UploadCloud, X, RefreshCw, KeyRound
} from 'lucide-react';

const AuthView = ({ onLogin }) => {
  // mode: 'login' | 'register' | 'forgot_password'
  const [authMode, setAuthMode] = useState('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    otp_code: '',
    role: 'customer',
    location_details: '',
    staff_photo: '',
    machines_photo: '',
    utilities_photo: ''
  });

  // Forgot password specific state
  const [resetData, setResetData] = useState({
    email: '',
    otp_code: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Photo upload handlers
  const handlePhotoUpload = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(`File size for ${fieldName.replace('_', ' ')} is too large (max 10MB)`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  // Send OTP for Registration
  const handleSendRegisterOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError("Please enter a valid email address to receive the verification OTP.");
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setOtpVerified(false);
    try {
      const res = await axios.post('/api/auth/send-otp', { 
        email: formData.email, 
        purpose: 'registration' 
      });
      setOtpSent(true);
      setResendTimer(30);
      setSuccessMsg(res.data.message || "Verification OTP sent to your email. Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for Forgot Password
  const handleSendForgotOtp = async () => {
    if (!resetData.email || !resetData.email.includes('@')) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setOtpVerified(false);
    try {
      const res = await axios.post('/api/auth/send-otp', { 
        email: resetData.email, 
        purpose: 'password_reset' 
      });
      setForgotOtpSent(true);
      setResendTimer(30);
      setSuccessMsg(res.data.message || "Password reset code sent to your email. Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Verify your email.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP explicitly
  const handleVerifyOtp = async (purpose) => {
    const email = purpose === 'password_reset' ? resetData.email : formData.email;
    const otp_code = purpose === 'password_reset' ? resetData.otp_code : formData.otp_code;
    
    if (!otp_code || otp_code.length < 6) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp_code, purpose });
      if (res.data.success) {
        setOtpVerified(true);
        alert("OTP Verified Successfully! You may now proceed.");
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid or expired OTP code.');
    }
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (resetData.new_password !== resetData.confirm_new_password) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify the OTP first before resetting password.");
      return;
    }

    if (resetData.new_password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: resetData.email,
        otp_code: resetData.otp_code,
        new_password: resetData.new_password
      });

      if (res.data.success) {
        setResetSuccess(true);
        setSuccessMsg(res.data.message || "Password updated successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Login or Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (authMode === 'login') {
        const res = await axios.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        if (res.data.success) {
          onLogin(res.data.user);
        }
      } else if (authMode === 'register') {
        // Validation for staff
        if (formData.role === 'staff') {
          if (!formData.location_details && !formData.address) {
            setError("Facility location details are required for staff registration.");
            setLoading(false);
            return;
          }
        }

        if (!formData.otp_code || !otpVerified) {
          setError("Please verify your email with the OTP code sent.");
          setLoading(false);
          return;
        }

        const res = await axios.post('/api/auth/register', formData);
        if (res.data.success) {
          if (formData.role === 'staff') {
            alert('Staff Registration Submitted!\n\nYour application with required verification photos and facility location has been submitted to the Admin for approval. You will receive an email once approved.');
          } else {
            alert('Registration successful! Please sign in with your new credentials.');
          }
          setAuthMode('login');
          setOtpSent(false);
          setFormData(prev => ({ ...prev, password: '', otp_code: '' }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10 px-4">
      <div className={`glass-card w-full ${authMode === 'register' && formData.role === 'staff' ? 'max-w-2xl' : 'max-w-md'} animate-fade-in shadow-2xl transition-all duration-300`}>
        
        {/* Header */}
        <div className="text-center mb-6">
          <img 
            src="/logo.jpeg" 
            alt="Smart Laundry Logo" 
            className="w-20 h-20 mx-auto rounded-full object-cover mb-3 shadow-lg border-2 border-white ring-4 ring-blue-50" 
          />
          
          {authMode === 'login' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to manage your laundry operations & orders</p>
            </>
          )}

          {authMode === 'register' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h1>
              <p className="text-gray-500 text-sm mt-1">
                {formData.role === 'staff' ? 'Register as a Staff Service Partner (Requires Admin Review)' : 'Join us for premium seamless laundry services'}
              </p>
            </>
          )}

          {authMode === 'forgot_password' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h1>
              <p className="text-gray-500 text-sm mt-1">Verify your email to create a new secure password</p>
            </>
          )}
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-5 text-sm flex items-start gap-2.5 border border-red-200 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 text-green-700 p-3.5 rounded-xl mb-5 text-sm flex items-start gap-2.5 border border-green-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{successMsg}</div>
          </div>
        )}

        {/* ================= FORGOT PASSWORD VIEW ================= */}
        {authMode === 'forgot_password' ? (
          <div>
            {!resetSuccess ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Registered Email Address
                  </label>
                  <div className="input-with-icon">
                    <Mail className="absolute left-4 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="name@example.com" 
                      value={resetData.email} 
                      onChange={handleResetChange} 
                      required 
                      disabled={forgotOtpSent}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:bg-gray-100" 
                    />
                  </div>
                </div>

                {!forgotOtpSent ? (
                  <button 
                    type="button" 
                    onClick={handleSendForgotOtp} 
                    disabled={loading || !resetData.email} 
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                    Send Password Reset Code
                  </button>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          6-Digit OTP Code
                        </label>
                        <button 
                          type="button" 
                          onClick={handleSendForgotOtp} 
                          disabled={resendTimer > 0}
                          className={`text-xs font-semibold ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
                        >
                          {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                        </button>
                      </div>
                      <div className="input-with-icon relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          name="otp_code" 
                          maxLength="6"
                          placeholder="Enter 6-digit OTP code" 
                          value={resetData.otp_code} 
                          onChange={handleResetChange} 
                          required 
                          disabled={otpVerified}
                          className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono tracking-widest text-lg" 
                        />
                        <button 
                          type="button" 
                          onClick={() => handleVerifyOtp('password_reset')} 
                          disabled={otpVerified || !resetData.otp_code} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-200 disabled:opacity-50 transition-colors"
                        >
                          {otpVerified ? 'Verified' : 'Verify'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <div className="input-with-icon relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="new_password" 
                          placeholder="At least 6 characters" 
                          value={resetData.new_password} 
                          onChange={handleResetChange} 
                          required 
                          className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Confirm New Password
                      </label>
                      <div className="input-with-icon relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          name="confirm_new_password" 
                          placeholder="Re-enter new password" 
                          value={resetData.confirm_new_password} 
                          onChange={handleResetChange} 
                          required 
                          className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Complete!</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Your password has been securely updated. You can now log in to your account with your new credentials.
                </p>
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setFormData(prev => ({ ...prev, email: resetData.email, password: '' }));
                    setError('');
                    setSuccessMsg('');
                    setResetSuccess(false);
                    setForgotOtpSent(false);
                  }}
                  className="btn-primary w-full py-3"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}

            <div className="mt-6 text-center border-t border-gray-100 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setSuccessMsg('');
                }} 
                className="text-gray-600 hover:text-primary font-medium text-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* ================= LOGIN & REGISTER FORMS ================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Type Selector for Register */}
            {authMode === 'register' && (
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 mb-2">
                <span className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                  Select Account Type:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                    formData.role === 'customer' 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="customer" 
                      checked={formData.role === 'customer'} 
                      onChange={handleChange} 
                      className="hidden" 
                    />
                    Customer
                  </label>

                  <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                    formData.role === 'staff' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="staff" 
                      checked={formData.role === 'staff'} 
                      onChange={handleChange} 
                      className="hidden" 
                    />
                    Staff Partner
                  </label>
                </div>
              </div>
            )}


            {/* Full Name (Register Only) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="input-with-icon">
                  <User className="absolute left-4 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="e.g. John Doe" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="input-with-icon">
                <Mail className="absolute left-4 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="name@example.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>
            </div>

            {/* OTP Verification for Register */}
            {authMode === 'register' && !otpSent && (
              <button 
                type="button" 
                onClick={handleSendRegisterOtp} 
                disabled={loading} 
                className="w-full bg-blue-50 text-primary font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200"
              >
                <Mail className="w-4 h-4" /> Send Email Verification OTP
              </button>
            )}

            {authMode === 'register' && otpSent && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Verification OTP Code
                  </label>
                  <button 
                    type="button" 
                    onClick={handleSendRegisterOtp} 
                    disabled={resendTimer > 0}
                    className={`text-xs font-semibold ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
                  >
                    {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                  </button>
                </div>
                <div className="input-with-icon relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    name="otp_code" 
                    maxLength="6"
                    placeholder="Enter 6-digit OTP" 
                    value={formData.otp_code} 
                    onChange={handleChange} 
                    required 
                    disabled={otpVerified}
                    className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono tracking-widest text-lg" 
                  />
                  <button 
                    type="button" 
                    onClick={() => handleVerifyOtp('registration')} 
                    disabled={otpVerified || !formData.otp_code} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-200 disabled:opacity-50 transition-colors"
                  >
                    {otpVerified ? 'Verified' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                {authMode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setResetData(prev => ({ ...prev, email: formData.email }));
                      setError('');
                      setSuccessMsg('');
                      setForgotOtpSent(false);
                      setResetSuccess(false);
                    }}
                    className="text-xs text-primary font-semibold hover:text-blue-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="input-with-icon relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder={authMode === 'login' ? "Enter your password" : "Create strong password"} 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Extra Register Fields */}
            {authMode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <div className="input-with-icon">
                      <Phone className="absolute left-4 text-gray-400 w-5 h-5" />
                      <input 
                        type="tel" 
                        name="phone" 
                        placeholder="e.g. 9876543210" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Primary Address
                    </label>
                    <div className="input-with-icon">
                      <MapPin className="absolute left-4 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        name="address" 
                        placeholder="Street, City, Pin" 
                        value={formData.address} 
                        onChange={handleChange} 
                        required 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* ================= STAFF MANDATORY REQUIREMENTS ================= */}
                {formData.role === 'staff' && (
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-indigo-600" /> Mandatory Verification Requirements
                      </h4>
                      <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        Admin Approval Required
                      </span>
                    </div>

                    {/* Facility Location Details */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Facility Location & Landmarks (Mandatory)
                      </label>
                      <textarea
                        name="location_details"
                        rows="2"
                        placeholder="Enter detailed shop/hub address, landmark, floor number, or Google Maps location link..."
                        value={formData.location_details}
                        onChange={handleChange}
                        required
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    {/* 3 Verification Photos removed as requested */}
                  </div>
                )}
              </>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg mt-6 ${
                authMode === 'register' && formData.role === 'staff' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                  : 'btn-primary shadow-blue-200'
              }`}
            >
              {loading ? 'Processing...' : (
                authMode === 'login' 
                  ? 'Sign In to Dashboard' 
                  : (formData.role === 'staff' ? 'Submit Staff Application for Review' : 'Create Customer Account')
              )}
            </button>
          </form>
        )}

        {/* Switch Login / Register Mode Footer */}
        {authMode !== 'forgot_password' && (
          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button 
              type="button" 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
                setSuccessMsg('');
                setOtpSent(false);
              }} 
              className="text-primary hover:text-blue-700 font-semibold text-sm transition-colors"
            >
              {authMode === 'login' 
                ? "Don't have an account? Create New Account" 
                : "Already registered? Sign In Here"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthView;
