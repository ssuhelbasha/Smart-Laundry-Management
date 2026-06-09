package com.smartlaundry.data.repository
 
import com.smartlaundry.data.model.Order
import com.smartlaundry.data.remote.RetrofitClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
 
class OrderRepository {
    private val api = RetrofitClient.apiService
 
    companion object {
        // 💡 Local Offline Database State (Simulates Server Data offline!)
        private val localOrders = mutableListOf<Order>(
            Order(
                orderId = "ord_mock1",
                userId = "usr_cust1",
                serviceType = "Dry Cleaning",
                fabricType = "Silk Saree",
                totalQuantity = 3,
                pickupDate = "2026-06-03",
                status = "Washing",
                totalPrice = 9.00,
                paymentStatus = "Pending",
                assignedStaffId = "usr_staff1",
                createdAt = System.currentTimeMillis() - 3600000
            )
        )
        private var localBasePrice = 2.0
    }
 
    // Place a new laundry order (with offline fallback)
    suspend fun placeOrder(order: Order): Boolean {
        return try {
            val response = api.createOrder(order)
            response["success"] as? Boolean ?: false
        } catch (e: Exception) {
            e.printStackTrace()
            // 💡 AUTO-FALLBACK: Place order in offline mock list!
            val newOrder = order.copy(
                orderId = "ord_" + Math.random().toString().substring(2, 8),
                status = "Pickup Pending"
            )
            localOrders.add(0, newOrder)
            true
        }
    }
 
    // Real-Time order progress updates using periodic HTTP polling (with offline fallback)
    fun observeOrderUpdates(orderId: String): Flow<Order?> = flow {
        var localOfflineMode = false
        while (true) {
            try {
                if (!localOfflineMode) {
                    val orders = api.getOrders()
                    val order = orders.find { it.orderId == orderId }
                    emit(order)
                } else {
                    emit(localOrders.find { it.orderId == orderId })
                }
            } catch (e: Exception) {
                e.printStackTrace()
                localOfflineMode = true
                emit(localOrders.find { it.orderId == orderId })
            }
            delay(3000) // Poll every 3 seconds
        }
    }
 
    // Observe active customer orders stream (with offline fallback)
    fun observeUserOrders(userId: String): Flow<List<Order>> = flow {
        var localOfflineMode = false
        while (true) {
            try {
                if (!localOfflineMode) {
                    val orders = api.getOrders(userId = userId)
                    emit(orders)
                } else {
                    emit(localOrders.filter { it.userId == userId })
                }
            } catch (e: Exception) {
                e.printStackTrace()
                localOfflineMode = true
                emit(localOrders.filter { it.userId == userId })
            }
            delay(3000)
        }
    }
 
    // Observe staff orders stream (with offline fallback)
    fun observeStaffOrders(staffId: String): Flow<List<Order>> = flow {
        var localOfflineMode = false
        while (true) {
            try {
                if (!localOfflineMode) {
                    val orders = api.getOrders(staffId = staffId)
                    emit(orders)
                } else {
                    emit(localOrders.filter { it.assignedStaffId == staffId || it.status == "Pickup Pending" || it.assignedStaffId.isEmpty() })
                }
            } catch (e: Exception) {
                e.printStackTrace()
                localOfflineMode = true
                emit(localOrders.filter { it.assignedStaffId == staffId || it.status == "Pickup Pending" || it.assignedStaffId.isEmpty() })
            }
            delay(3000)
        }
    }
 
    // Observe all orders (Admin view - with offline fallback)
    fun observeAllOrders(): Flow<List<Order>> = flow {
        var localOfflineMode = false
        while (true) {
            try {
                if (!localOfflineMode) {
                    val orders = api.getOrders()
                    emit(orders)
                } else {
                    emit(localOrders)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                localOfflineMode = true
                emit(localOrders)
            }
            delay(5000) // Poll every 5 seconds for admin metrics
        }
    }
 
    // Update order status & staff assignment in Express (with offline fallback)
    suspend fun updateOrderStatus(orderId: String, status: String, staffId: String? = null): Boolean {
        return try {
            val details = mutableMapOf("status" to status)
            if (staffId != null) {
                details["staffId"] = staffId
            }
            val response = api.updateOrderStatus(orderId, details)
            response["success"] as? Boolean ?: false
        } catch (e: Exception) {
            e.printStackTrace()
            // 💡 AUTO-FALLBACK: Update local order state!
            val order = localOrders.find { it.orderId == orderId }
            if (order != null) {
                val index = localOrders.indexOf(order)
                var updated = order.copy(status = status)
                if (staffId != null) {
                    updated = updated.copy(assignedStaffId = staffId)
                }
                if (status == "Delivered") {
                    updated = updated.copy(paymentStatus = "Paid")
                }
                localOrders[index] = updated
                true
            } else {
                false
            }
        }
    }
 
    // Get laundry piece base price (for Admin controls - with offline fallback)
    suspend fun getBasePrice(): Double {
        return try {
            val response = api.getPricing()
            response["basePrice"] as? Double ?: localBasePrice
        } catch (e: Exception) {
            localBasePrice
        }
    }
 
    // Update base price (Admin feature - with offline fallback)
    suspend fun updateBasePrice(newPrice: Double): Boolean {
        return try {
            val response = api.updateOrderStatus("pricing", mapOf("basePrice" to newPrice.toString()))
            response["success"] as? Boolean ?: false
        } catch (e: Exception) {
            localBasePrice = newPrice
            true
        }
    }
}
