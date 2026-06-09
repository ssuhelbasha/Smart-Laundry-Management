package com.smartlaundry.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartlaundry.data.model.Order
import com.smartlaundry.data.repository.OrderRepository
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class AdminViewModel(
    private val repository: OrderRepository = OrderRepository(),
    private val userRepository: com.smartlaundry.data.repository.UserRepository = com.smartlaundry.data.repository.UserRepository()
) : ViewModel() {

    private val _allOrders = MutableLiveData<List<Order>>()
    val allOrders: LiveData<List<Order>> get() = _allOrders

    private val _allUsers = MutableLiveData<List<com.smartlaundry.data.model.User>>()
    val allUsers: LiveData<List<com.smartlaundry.data.model.User>> get() = _allUsers

    private val _totalRevenue = MutableLiveData<Double>(0.0)
    val totalRevenue: LiveData<Double> get() = _totalRevenue

    private val _basePrice = MutableLiveData<Double>(2.0)
    val basePrice: LiveData<Double> get() = _basePrice

    private val _pricingUpdateStatus = MutableLiveData<Boolean>()
    val pricingUpdateStatus: LiveData<Boolean> get() = _pricingUpdateStatus

    init {
        loadAllOrders()
        loadBasePrice()
        loadAllUsers()
    }

    private fun loadAllUsers() {
        viewModelScope.launch {
            _allUsers.value = userRepository.getAllUsers()
        }
    }

    private fun loadBasePrice() {
        viewModelScope.launch {
            _basePrice.value = repository.getBasePrice()
        }
    }

    private fun loadAllOrders() {
        viewModelScope.launch {
            repository.observeAllOrders().collectLatest { orders ->
                _allOrders.value = orders
                calculateMetrics(orders)
            }
        }
    }

    private fun calculateMetrics(orders: List<Order>) {
        val total = orders.sumOf { if (it.paymentStatus == "Paid" || it.status == "Delivered") it.totalPrice else 0.0 }
        _totalRevenue.value = total
    }

    fun modifyBasePrice(newPrice: Double) {
        viewModelScope.launch {
            val success = repository.updateBasePrice(newPrice)
            _pricingUpdateStatus.value = success
            if (success) {
                _basePrice.value = newPrice
            }
        }
    }

    fun updateOrderStatus(orderId: String, newStatus: String) {
        viewModelScope.launch {
            val success = repository.updateOrderStatus(orderId, newStatus)
            if (success) {
                loadAllOrders() // Refresh list
            }
        }
    }
}
