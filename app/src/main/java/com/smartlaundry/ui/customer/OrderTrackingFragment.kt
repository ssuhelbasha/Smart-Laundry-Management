package com.smartlaundry.ui.customer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.smartlaundry.databinding.FragmentTrackingBinding
import com.smartlaundry.ui.viewmodel.AuthViewModel
import com.smartlaundry.ui.viewmodel.OrderViewModel
import com.smartlaundry.utils.QRCodeGenerator

class OrderTrackingFragment : Fragment() {

    private var _binding: FragmentTrackingBinding? = null
    private val binding get() = _binding!!

    private val authViewModel: AuthViewModel by activityViewModels()
    private val orderViewModel: OrderViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTrackingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        authViewModel.currentUserState.observe(viewLifecycleOwner) { user ->
            if (user != null) {
                orderViewModel.loadUserOrders(user.userId)
            }
        }
        authViewModel.checkCurrentUser()

        // Track user's latest active or completed order
        orderViewModel.userOrders.observe(viewLifecycleOwner) { orders ->
            val latestOrder = orders.firstOrNull { it.status != "Delivered" } ?: orders.firstOrNull()
            if (latestOrder != null) {
                val isCompleted = latestOrder.status == "Delivered"
                
                binding.tvOrderId.text = if (isCompleted) {
                    "Order Completed & Delivered! 🎉"
                } else {
                    "Order ID: ${latestOrder.orderId.take(8).uppercase()}"
                }
                
                binding.tvOrderService.text = "Service: ${latestOrder.serviceType}"
                binding.tvOrderQuantity.text = "Clothes: ${latestOrder.totalQuantity} pcs | Total Price: ₹${String.format("%.2f", latestOrder.totalPrice)}"
                
                // Track state updates
                orderViewModel.startTrackingOrder(latestOrder.orderId)
                
                if (isCompleted) {
                    binding.cardQRCode.visibility = View.GONE
                    updateTimelineSteps("Delivered")
                } else {
                    binding.cardQRCode.visibility = View.VISIBLE
                    // Generate and display QR Code
                    val qrBitmap = QRCodeGenerator.generateOrderQRCode(latestOrder.orderId)
                    if (qrBitmap != null) {
                        binding.ivQRCode.setImageBitmap(qrBitmap)
                    }
                }
            } else {
                binding.tvOrderId.text = "No Orders Placed Yet"
                binding.tvOrderService.text = "Go to 'Book Wash' to place your first booking!"
                binding.tvOrderQuantity.text = ""
                binding.cardQRCode.visibility = View.GONE
                resetTimeline()
            }
        }

        // Realtime timeline updates
        orderViewModel.trackedOrder.observe(viewLifecycleOwner) { order ->
            if (order != null) {
                updateTimelineSteps(order.status)
                if (order.status == "Delivered") {
                    binding.tvOrderId.text = "Order Completed & Delivered! 🎉"
                    binding.cardQRCode.visibility = View.GONE
                } else {
                    binding.cardQRCode.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun updateTimelineSteps(status: String) {
        resetTimeline()
        when (status) {
            "Pickup Pending" -> {
                binding.cbStep1.isChecked = true
            }
            "Picked Up" -> {
                binding.cbStep1.isChecked = true
                binding.cbStep2.isChecked = true
            }
            "Washing" -> {
                binding.cbStep1.isChecked = true
                binding.cbStep2.isChecked = true
                binding.cbStep3.isChecked = true
            }
            "Ironing" -> {
                binding.cbStep1.isChecked = true
                binding.cbStep2.isChecked = true
                binding.cbStep3.isChecked = true
                binding.cbStep4.isChecked = true
            }
            "Ready" -> {
                binding.cbStep1.isChecked = true
                binding.cbStep2.isChecked = true
                binding.cbStep3.isChecked = true
                binding.cbStep4.isChecked = true
                binding.cbStep5.isChecked = true
            }
            "Delivered" -> {
                binding.cbStep1.isChecked = true
                binding.cbStep2.isChecked = true
                binding.cbStep3.isChecked = true
                binding.cbStep4.isChecked = true
                binding.cbStep5.isChecked = true
                binding.cbStep6.isChecked = true
            }
        }
    }

    private fun resetTimeline() {
        binding.cbStep1.isChecked = false
        binding.cbStep2.isChecked = false
        binding.cbStep3.isChecked = false
        binding.cbStep4.isChecked = false
        binding.cbStep5.isChecked = false
        binding.cbStep6.isChecked = false
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
