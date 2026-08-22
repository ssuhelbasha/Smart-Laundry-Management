import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final orders = await ApiService.getOrders();
      setState(() {
        _orders = orders.where((o) => o['status'] != 'Rejected').toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) Navigator.of(context).pushReplacementNamed('/auth');
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    if (newStatus == 'Rejected') {
       bool? confirm = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
             title: const Text('Confirm Rejection'),
             content: const Text('Are you sure you want to reject this order? It will be refunded.'),
             actions: [
               TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
               TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Reject')),
             ]
          )
       );
       if (confirm != true) return;
    }

    try {
      await ApiService.updateOrderStatus(id, newStatus);
      _fetchOrders();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  List<PopupMenuEntry<String>> _buildMenuItems(String currentStatus) {
    List<PopupMenuEntry<String>> items = [];
    
    if (currentStatus == 'Pending') {
      items.add(const PopupMenuItem(value: 'Picked Up', child: Text('Mark Picked Up')));
      items.add(const PopupMenuItem(value: 'Rejected', child: Text('Reject Order')));
    } else if (currentStatus == 'Picked Up') {
      items.add(const PopupMenuItem(value: 'Washing', child: Text('Start Washing')));
    } else if (currentStatus == 'Washing') {
      items.add(const PopupMenuItem(value: 'Drying', child: Text('Move to Drying')));
    } else if (currentStatus == 'Drying') {
      items.add(const PopupMenuItem(value: 'Delivered', child: Text('Mark Delivered')));
    }
    
    return items;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchOrders),
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty 
             ? const Center(child: Text("You're all caught up!"))
             : ListView.builder(
              itemCount: _orders.length,
              itemBuilder: (context, index) {
                final order = _orders[index];
                final status = order['status'] ?? 'Unknown';
                final menuItems = _buildMenuItems(status);

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  elevation: 2,
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    title: Text(
                      '${order['serviceType']} - ${order['fabricType']}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        Text('Order ID: ${order['orderId']}'),
                        Text('Total: \$${(order['totalPrice'] as num?)?.toStringAsFixed(2)}'),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(color: Colors.blue.shade900, fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    ),
                    trailing: menuItems.isNotEmpty ? PopupMenuButton<String>(
                      onSelected: (newStatus) => _updateStatus(order['orderId'], newStatus), // FIX: orderId instead of _id
                      itemBuilder: (context) => menuItems,
                    ) : const Icon(Icons.check_circle, color: Colors.green),
                  ),
                );
              },
            ),
    );
  }
}
