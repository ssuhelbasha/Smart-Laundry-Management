import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _otpController = TextEditingController();
  
  bool _isLogin = true;
  bool _otpSent = false;
  String _selectedRole = 'customer';
  bool _isLoading = false;

  Future<void> _sendOtp() async {
    if (_emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter email first')));
      return;
    }
    setState(() => _isLoading = true);
    try {
      await ApiService.sendOtp(_emailController.text, 'registration');
      setState(() => _otpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OTP sent to email')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      if (_isLogin) {
        final res = await ApiService.login(_emailController.text, _passwordController.text);
        final user = res['user'];
        await _saveUserData(user['userId'], user['role']);
        _navigateBasedOnRole(user['role']);
      } else {
        await ApiService.register(
          _emailController.text,
          _passwordController.text,
          _selectedRole,
          _nameController.text,
          _phoneController.text,
          _addressController.text,
          _otpController.text,
        );
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration successful. Please login.')));
        setState(() {
          _isLogin = true;
          _otpSent = false;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveUserData(String userId, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userId', userId);
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
                _isLogin ? 'Welcome Back' : 'Create Account',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              if (!_isLogin)
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
                ),
              if (!_isLogin) const SizedBox(height: 16),

              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),

              if (!_isLogin && !_otpSent)
                FilledButton.tonal(
                  onPressed: _isLoading ? null : _sendOtp,
                  child: const Text('Send OTP to Email'),
                ),
              if (!_isLogin && !_otpSent) const SizedBox(height: 16),

              if (!_isLogin && _otpSent)
                TextField(
                  controller: _otpController,
                  decoration: const InputDecoration(labelText: 'OTP Code', border: OutlineInputBorder()),
                  keyboardType: TextInputType.number,
                ),
              if (!_isLogin && _otpSent) const SizedBox(height: 16),

              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),

              if (!_isLogin)
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                ),
              if (!_isLogin) const SizedBox(height: 16),

              if (!_isLogin)
                TextField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
                ),
              if (!_isLogin) const SizedBox(height: 16),

              if (!_isLogin)
                DropdownButtonFormField<String>(
                  value: _selectedRole,
                  decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'customer', child: Text('Customer')),
                    DropdownMenuItem(value: 'staff', child: Text('Staff')),
                    DropdownMenuItem(value: 'admin', child: Text('Admin')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedRole = value!;
                    });
                  },
                ),
              const SizedBox(height: 24),
              _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : FilledButton(
                      onPressed: (_isLogin || _otpSent) ? _submit : null,
                      child: Text(_isLogin ? 'Login' : 'Register'),
                    ),
              TextButton(
                onPressed: () => setState(() {
                  _isLogin = !_isLogin;
                  _otpSent = false;
                }),
                child: Text(_isLogin ? 'Don\'t have an account? Register' : 'Already have an account? Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
