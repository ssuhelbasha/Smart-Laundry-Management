import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/auth_screen.dart';
import 'screens/customer_screen.dart';
import 'screens/staff_screen.dart';
import 'screens/admin_screen.dart';

void main() {
  runApp(const SmartLaundryApp());
}

class SmartLaundryApp extends StatelessWidget {
  const SmartLaundryApp({super.key});

  Future<String?> _getInitialRoute() async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('role');
    final token = prefs.getString('token');
    
    if (token != null && role != null) {
      return '/$role'; // e.g., '/customer', '/staff', '/admin'
    }
    return '/';
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Laundry',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
        useMaterial3: true,
      ),
      home: FutureBuilder<String?>(
        future: _getInitialRoute(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          final initialRoute = snapshot.data ?? '/';
          
          if (initialRoute == '/customer') return const CustomerScreen();
          if (initialRoute == '/staff') return const StaffScreen();
          if (initialRoute == '/admin') return const AdminScreen();
          
          return const AuthScreen();
        },
      ),
      routes: {
        '/auth': (context) => const AuthScreen(),
        '/customer': (context) => const CustomerScreen(),
        '/staff': (context) => const StaffScreen(),
        '/admin': (context) => const AdminScreen(),
      },
    );
  }
}
