import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://smart-laundry-management.vercel.app/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to login');
    }
  }

  static Future<Map<String, dynamic>> register(String email, String password, String role, String otpCode, {String? phone, String? address}) async {
    final body = {
      'email': email,
      'password': password,
      'role': role,
      'otp_code': otpCode,
    };
    if (phone != null) body['phone'] = phone;
    if (address != null) body['address'] = address;
    
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorMsg = jsonDecode(response.body)['message'] ?? 'Failed to register';
      throw Exception(errorMsg);
    }
  }

  static Future<Map<String, dynamic>> sendOtp(String email, String purpose) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'purpose': purpose}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorMsg = jsonDecode(response.body)['message'] ?? 'Failed to send OTP';
      throw Exception(errorMsg);
    }
  }

  static Future<Map<String, dynamic>> resetPassword(String email, String otpCode, String newPassword) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp_code': otpCode, 'new_password': newPassword}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorMsg = jsonDecode(response.body)['message'] ?? 'Failed to reset password';
      throw Exception(errorMsg);
    }
  }

  static Future<List<dynamic>> getOrders() async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load orders');
    }
  }

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: await _getHeaders(),
      body: jsonEncode(orderData),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create order');
    }
  }

  static Future<Map<String, dynamic>> updateOrderStatus(String id, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$id'),
      headers: await _getHeaders(),
      body: jsonEncode({'status': status}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update order status');
    }
  }
}
