package com.smartlaundry.ui.customer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.smartlaundry.R
import com.smartlaundry.databinding.FragmentDashboardBinding
import com.smartlaundry.ui.viewmodel.AuthViewModel
import com.smartlaundry.ui.viewmodel.OrderViewModel

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    private val authViewModel: AuthViewModel by activityViewModels()
    private val orderViewModel: OrderViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Track user profile details
        authViewModel.currentUserState.observe(viewLifecycleOwner) { user ->
            if (user != null) {
                binding.tvWelcome.text = "Welcome Back, ${user.name}!"
                orderViewModel.loadUserOrders(user.userId)
            }
        }
        authViewModel.checkCurrentUser()

        // Track active orders real-time status card
        orderViewModel.userOrders.observe(viewLifecycleOwner) { orders ->
            val activeOrder = orders.firstOrNull { it.status != "Delivered" }
            if (activeOrder != null) {
                binding.cardOrderStatus.visibility = View.VISIBLE
                binding.tvOrderStatusBadge.text = activeOrder.status
                binding.tvOrderEstDelivery.text = "Estimated Delivery: ${activeOrder.pickupDate}"
                
                // Track active order changes in real-time
                orderViewModel.startTrackingOrder(activeOrder.orderId)
            } else {
                binding.cardOrderStatus.visibility = View.GONE
            }
        }

        // Live real-time single order listener update
        orderViewModel.trackedOrder.observe(viewLifecycleOwner) { order ->
            if (order != null && order.status != "Delivered") {
                binding.cardOrderStatus.visibility = View.VISIBLE
                binding.tvOrderStatusBadge.text = order.status
            }
        }

        // Card Clicks - Pre-select service and navigate
        binding.cardWash.setOnClickListener { navigateToBooking("Standard Wash") }
        binding.cardDryClean.setOnClickListener { navigateToBooking("Dry Cleaning") }
        binding.cardIroning.setOnClickListener { navigateToBooking("Iron / Press") }
        binding.cardExpress.setOnClickListener { navigateToBooking("Express Wash") }
    }

    private fun navigateToBooking(serviceName: String) {
        val bookingFragment = BookingFragment().apply {
            arguments = Bundle().apply {
                putString("preselected_service", serviceName)
            }
        }
        parentFragmentManager.beginTransaction()
            .replace(R.id.nav_host_fragment, bookingFragment)
            .commit()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
