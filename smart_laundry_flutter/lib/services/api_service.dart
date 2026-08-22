import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Production backend URL
  static const String baseUrl = 'https://smart-laundry-backend-lkaysswj0-suhel-basha-shaik-s-projects.vercel.app/api';

  static Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userId');
  }

  static Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('role');
  }

  static Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  static Future<Map<String, dynamic>> sendOtp(String email, String purpose) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: _getHeaders(),
      body: jsonEncode({'email': email, 'purpose': purpose}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to send OTP');
    }
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _getHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to login');
    }
  }

  static Future<Map<String, dynamic>> register(
      String email, String password, String role, String name, String phone, String address, String otpCode) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _getHeaders(),
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        'address': address,
        'role': role,
        'otp_code': otpCode,
      }),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to register');
    }
  }

  static Future<List<dynamic>> getOrders() async {
    final userId = await getUserId();
    final role = await getRole();
    
    if (userId == null) throw Exception('Not logged in');

    String url = '$baseUrl/orders';
    if (role == 'customer') {
      url += '?userId=$userId';
    } else if (role == 'staff') {
      url += '?staffId=$userId';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load orders');
    }
  }

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final userId = await getUserId();
    if (userId == null) throw Exception('Not logged in');
    
    // Ensure userId is in the payload
    orderData['userId'] = userId;

    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: _getHeaders(),
      body: jsonEncode(orderData),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to create order');
    }
  }

  static Future<Map<String, dynamic>> updateOrderStatus(String id, String status) async {
    final userId = await getUserId();
    if (userId == null) throw Exception('Not logged in');

    final response = await http.put(
      Uri.parse('$baseUrl/orders/$id/status'),
      headers: _getHeaders(),
      body: jsonEncode({'status': status, 'staffId': userId}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to update order status');
    }
  }
}
