package com.smartlaundry.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartlaundry.data.model.Order
import com.smartlaundry.data.repository.OrderRepository
import com.smartlaundry.utils.AIRecommendationEngine
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class OrderViewModel(private val repository: OrderRepository = OrderRepository()) : ViewModel() {

    private val _orderPlacementState = MutableLiveData<OrderPlacementState>()
    val orderPlacementState: LiveData<OrderPlacementState> get() = _orderPlacementState

    private val _trackedOrder = MutableLiveData<Order?>()
    val trackedOrder: LiveData<Order?> get() = _trackedOrder

    private val _userOrders = MutableLiveData<List<Order>>()
    val userOrders: LiveData<List<Order>> get() = _userOrders

    private val _staffOrders = MutableLiveData<List<Order>>()
    val staffOrders: LiveData<List<Order>> get() = _staffOrders

    private val _basePrice = MutableLiveData<Double>(2.0)
    val basePrice: LiveData<Double> get() = _basePrice

    private val _fabricRecommendation = MutableLiveData<String>()
    val fabricRecommendation: LiveData<String> get() = _fabricRecommendation

    init {
        fetchBasePrice()
    }

    private fun fetchBasePrice() {
        viewModelScope.launch {
            val price = repository.getBasePrice()
            _basePrice.value = price
        }
    }

    // AI recommendation trigger
    fun analyzeFabricInput(input: String) {
        if (input.trim().isEmpty()) {
            _fabricRecommendation.value = ""
            return
        }
        val rec = AIRecommendationEngine.recommendBestWash(input)
        _fabricRecommendation.value = "${rec.first.description} (Reason: ${rec.second})"
    }

    fun calculatePrice(quantity: Int, serviceType: String): Double {
        val base = _basePrice.value ?: 2.0
        val multiplier = when (serviceType) {
            "Dry Cleaning" -> 1.5
            "Iron / Press"  -> 0.8
            "Express Wash" -> 1.8
            else -> 1.0 // Standard Wash
        }
        return quantity * base * multiplier
    }

    fun createOrder(order: Order) {
        _orderPlacementState.value = OrderPlacementState.Loading
        viewModelScope.launch {
            val success = repository.placeOrder(order)
            if (success) {
                _orderPlacementState.value = OrderPlacementState.Success
            } else {
                _orderPlacementState.value = OrderPlacementState.Error("Failed to book order")
            }
        }
    }

    fun startTrackingOrder(orderId: String) {
        viewModelScope.launch {
            repository.observeOrderUpdates(orderId).collectLatest { order ->
                _trackedOrder.value = order
            }
        }
    }

    fun loadUserOrders(userId: String) {
        viewModelScope.launch {
            repository.observeUserOrders(userId).collectLatest { orders ->
                _userOrders.value = orders
            }
        }
    }

    fun loadStaffOrders(staffId: String) {
        viewModelScope.launch {
            repository.observeStaffOrders(staffId).collectLatest { orders ->
                _staffOrders.value = orders
            }
        }
    }

    fun advanceOrderState(order: Order, staffId: String) {
        val nextStatus = when (order.status) {
            "Pickup Pending" -> "Picked Up"
            "Picked Up"      -> "Washing"
            "Washing"        -> "Ironing"
            "Ironing"        -> "Ready"
            "Ready"          -> "Delivered"
            else -> order.status
        }
        viewModelScope.launch {
            repository.updateOrderStatus(order.orderId, nextStatus, staffId)
        }
    }

    fun confirmDeliveryByQR(orderId: String, staffId: String) {
        viewModelScope.launch {
            repository.updateOrderStatus(orderId, "Delivered", staffId)
        }
    }

    sealed class OrderPlacementState {
        object Idle : OrderPlacementState()
        object Loading : OrderPlacementState()
        object Success : OrderPlacementState()
        data class Error(val message: String) : OrderPlacementState()
    }
}
