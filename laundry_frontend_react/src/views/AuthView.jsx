import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

const AuthView = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', address: '', otp_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError("Please enter email to send OTP.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/send-otp', { email: formData.email, purpose: 'registration' });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        if (res.data.success) {
          onLogin(res.data.user);
        }
      } else {
        const res = await axios.post('/api/auth/register', formData);
        if (res.data.success) {
          alert('Registration successful! Please sign in with your new credentials.');
          setIsLogin(true);
          setOtpSent(false);
          setFormData({ ...formData, password: '', otp_code: '' });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="glass-card w-full max-w-md animate-fade-in shadow-2xl">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="Logo" className="w-20 h-20 mx-auto rounded-full object-cover mb-4 shadow-lg border border-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Sign in to manage your laundry' : 'Join us for premium laundry services'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="input-with-icon">
              <User className="absolute left-4 text-gray-400 w-5 h-5" />
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            </div>
          )}

          <div className="input-with-icon">
            <Mail className="absolute left-4 text-gray-400 w-5 h-5" />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
          </div>

          {!isLogin && !otpSent && (
             <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-50 text-primary font-semibold py-2 rounded-xl hover:bg-blue-100 transition-colors">
               Send OTP to Email
             </button>
          )}

          {!isLogin && otpSent && (
             <div className="input-with-icon">
              <Lock className="absolute left-4 text-gray-400 w-5 h-5" />
              <input type="text" name="otp_code" placeholder="Enter OTP Code" value={formData.otp_code} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            </div>
          )}

          <div className="input-with-icon relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="input-with-icon">
                <Phone className="absolute left-4 text-gray-400 w-5 h-5" />
                <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div className="input-with-icon">
                <MapPin className="absolute left-4 text-gray-400 w-5 h-5" />
                <input type="text" name="address" placeholder="Full Address" value={formData.address} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => {setIsLogin(!isLogin); setError(''); setOtpSent(false);}} className="text-primary hover:text-blue-700 font-medium transition-colors">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
