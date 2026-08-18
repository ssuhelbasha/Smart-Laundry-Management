import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'dart:async';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  // mode: 'login' | 'register' | 'forgot_password'
  String _authMode = 'login';
  String _selectedRole = 'customer';
  bool _isLoading = false;
  bool _otpSent = false;
  
  int _resendTimer = 0;
  Timer? _timer;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    setState(() => _resendTimer = 30);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _sendOtp(String purpose) async {
    if (_emailController.text.isEmpty || !_emailController.text.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid email address.')));
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.sendOtp(_emailController.text, purpose);
      setState(() {
        _otpSent = true;
      });
      _startResendTimer();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'OTP sent to your email.')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submit() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields.')));
       return;
    }
    
    setState(() => _isLoading = true);
    try {
      if (_authMode == 'login') {
        final res = await ApiService.login(_emailController.text, _passwordController.text);
        await _saveUserData(res['token'], res['user']['role']);
        _navigateBasedOnRole(res['user']['role']);
      } else if (_authMode == 'register') {
        if (!_otpSent) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please verify your email with OTP first.')));
           setState(() => _isLoading = false);
           return;
        }
        if (_otpController.text.isEmpty) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter the OTP.')));
           setState(() => _isLoading = false);
           return;
        }
        await ApiService.register(
           _emailController.text, 
           _passwordController.text, 
           _selectedRole,
           _otpController.text,
           phone: _phoneController.text.isEmpty ? null : _phoneController.text,
           address: _addressController.text.isEmpty ? null : _addressController.text,
        );
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration successful. Please login.')));
        setState(() {
           _authMode = 'login';
           _otpSent = false;
           _otpController.clear();
        });
      } else if (_authMode == 'forgot_password') {
        if (!_otpSent) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please request a reset OTP first.')));
           setState(() => _isLoading = false);
           return;
        }
        if (_otpController.text.isEmpty) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter the OTP.')));
           setState(() => _isLoading = false);
           return;
        }
        final res = await ApiService.resetPassword(_emailController.text, _otpController.text, _passwordController.text);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Password reset successfully.')));
        setState(() {
           _authMode = 'login';
           _otpSent = false;
           _otpController.clear();
           _passwordController.clear();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveUserData(String token, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('role', role);
  }

  void _navigateBasedOnRole(String role) {
    Navigator.of(context).pushReplacementNamed('/$role');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.local_laundry_service, size: 80, color: Colors.blueAccent),
              const SizedBox(height: 24),
              Text(
                _authMode == 'login' ? 'Welcome Back' : _authMode == 'register' ? 'Create Account' : 'Reset Password',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
                enabled: !_otpSent,
              ),
              const SizedBox(height: 16),
              
              if (_authMode == 'register' && !_otpSent)
                DropdownButtonFormField<String>(
                  value: _selectedRole,
                  decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'customer', child: Text('Customer')),
                    DropdownMenuItem(value: 'staff', child: Text('Staff')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedRole = value!;
                    });
                  },
                ),
              if (_authMode == 'register' && !_otpSent) const SizedBox(height: 16),

              if (_authMode == 'register' && !_otpSent) ...[
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone (Optional)', border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Address (Optional)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
              ],
              
              if ((_authMode == 'register' || _authMode == 'forgot_password') && !_otpSent)
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : () => _sendOtp(_authMode == 'register' ? 'registration' : 'password_reset'),
                  icon: const Icon(Icons.mail),
                  label: Text(_authMode == 'register' ? 'Send Verification OTP' : 'Send Reset OTP'),
                ),

              if ((_authMode == 'register' || _authMode == 'forgot_password') && _otpSent) ...[
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _otpController,
                        decoration: const InputDecoration(labelText: '6-Digit OTP', border: OutlineInputBorder()),
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: _resendTimer > 0 ? null : () => _sendOtp(_authMode == 'register' ? 'registration' : 'password_reset'),
                      child: Text(_resendTimer > 0 ? 'Resend in ${_resendTimer}s' : 'Resend OTP'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],

              if (_authMode == 'login' || (_authMode == 'register' && _otpSent) || (_authMode == 'forgot_password' && _otpSent)) ...[
                TextField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: _authMode == 'forgot_password' ? 'New Password' : 'Password', 
                    border: const OutlineInputBorder()
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 24),
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : FilledButton(
                        onPressed: _submit,
                        child: Text(_authMode == 'login' ? 'Login' : _authMode == 'register' ? 'Register' : 'Reset Password'),
                      ),
              ],

              if (_authMode == 'login')
                TextButton(
                  onPressed: () {
                    setState(() {
                       _authMode = 'forgot_password';
                       _otpSent = false;
                       _passwordController.clear();
                       _otpController.clear();
                    });
                  },
                  child: const Text('Forgot Password?'),
                ),

              TextButton(
                onPressed: () {
                  setState(() {
                    _authMode = _authMode == 'login' ? 'register' : 'login';
                    _otpSent = false;
                    _passwordController.clear();
                    _otpController.clear();
                  });
                },
                child: Text(_authMode == 'login' ? 'Don\'t have an account? Register' : 'Already have an account? Login'),
              ),
            ],
          ),
        ),
      ),
    );
}
