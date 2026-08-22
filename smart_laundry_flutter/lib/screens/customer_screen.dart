import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class CustomerScreen extends StatefulWidget {
  const CustomerScreen({super.key});

  @override
  State<CustomerScreen> createState() => _CustomerScreenState();
}

class _CustomerScreenState extends State<CustomerScreen> {
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
        _orders = orders;
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

  void _showCreateOrderDialog() {
    String serviceType = 'Wash & Fold';
    String fabricType = 'Cotton';
    String quantityStr = '1';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: const Text('Create Order'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: serviceType,
                  decoration: const InputDecoration(labelText: 'Service Type'),
                  items: const [
                    DropdownMenuItem(value: 'Wash & Fold', child: Text('Wash & Fold')),
                    DropdownMenuItem(value: 'Dry Clean', child: Text('Dry Clean')),
                    DropdownMenuItem(value: 'Ironing', child: Text('Ironing')),
                  ],
                  onChanged: (val) => setState(() => serviceType = val!),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: fabricType,
                  decoration: const InputDecoration(labelText: 'Fabric Type'),
                  items: const [
                    DropdownMenuItem(value: 'Cotton', child: Text('Cotton')),
                    DropdownMenuItem(value: 'Silk', child: Text('Silk')),
                    DropdownMenuItem(value: 'Wool', child: Text('Wool')),
                    DropdownMenuItem(value: 'Synthetic', child: Text('Synthetic')),
                  ],
                  onChanged: (val) => setState(() => fabricType = val!),
                ),
                const SizedBox(height: 8),
                TextField(
                  decoration: const InputDecoration(labelText: 'Total Quantity'),
                  keyboardType: TextInputType.number,
                  onChanged: (val) => quantityStr = val,
                  controller: TextEditingController(text: quantityStr),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              FilledButton(
                onPressed: () async {
                  Navigator.pop(context);
                  
                  int qty = int.tryParse(quantityStr) ?? 1;
                  double price = qty * 2.0; // Basic mock pricing

                  try {
                    await ApiService.createOrder({
                      'serviceType': serviceType,
                      'fabricType': fabricType,
                      'totalQuantity': qty,
                      'pickupDate': DateTime.now().add(const Duration(days: 1)).toIso8601String(),
                      'totalPrice': price
                    });
                    _fetchOrders();
                  } catch (e) {
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                },
                child: const Text('Create'),
              ),
            ],
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(child: Text("No orders found."))
              : ListView.builder(
                  itemCount: _orders.length,
                  itemBuilder: (context, index) {
                    final order = _orders[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text('${order['serviceType'] ?? 'Unknown'} - ${order['fabricType'] ?? 'Unknown'}'),
                        subtitle: Text('Status: ${order['status'] ?? 'Pending'} | Qty: ${order['totalQuantity'] ?? 1} | Price: \$${(order['totalPrice'] as num?)?.toStringAsFixed(2) ?? '0.00'}'),
                        trailing: const Icon(Icons.local_laundry_service),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateOrderDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
