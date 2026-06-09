package com.smartlaundry.ui.customer

import android.app.DatePickerDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.smartlaundry.R
import com.smartlaundry.data.model.Order
import com.smartlaundry.databinding.FragmentBookingBinding
import com.smartlaundry.ui.viewmodel.AuthViewModel
import com.smartlaundry.ui.viewmodel.OrderViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class BookingFragment : Fragment() {

    private var _binding: FragmentBookingBinding? = null
    private val binding get() = _binding!!

    private val authViewModel: AuthViewModel by activityViewModels()
    private val orderViewModel: OrderViewModel by activityViewModels()
    private val calendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBookingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Populate Spinner
        val services = arrayOf("Standard Wash", "Dry Cleaning", "Iron / Press", "Express Wash")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, services)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerService.adapter = adapter

        // Check if service was preselected
        val preselected = arguments?.getString("preselected_service")
        if (preselected != null) {
            val index = services.indexOf(preselected)
            if (index >= 0) {
                binding.spinnerService.setSelection(index)
            }
        }

        // Setup AI recommendation TextWatcher
        binding.etFabricType.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                orderViewModel.analyzeFabricInput(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // Observe AI recommendations
        orderViewModel.fabricRecommendation.observe(viewLifecycleOwner) { rec ->
            if (rec.isNotEmpty()) {
                binding.llRecommendation.visibility = View.VISIBLE
                binding.tvRecommendBody.text = rec
            } else {
                binding.llRecommendation.visibility = View.GONE
            }
        }

        // Dynamically calculate estimated cost
        val updatePriceListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                recalculatePrice()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        binding.spinnerService.onItemSelectedListener = updatePriceListener

        binding.etQuantity.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                recalculatePrice()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // Select pickup date dialog
        binding.etPickupDate.setOnClickListener {
            showDatePicker()
        }

        // Confirm order placement
        binding.btnBookNow.setOnClickListener {
            placeLaundryOrder()
        }

        orderViewModel.orderPlacementState.observe(viewLifecycleOwner) { state ->
            when (state) {
                is OrderViewModel.OrderPlacementState.Success -> {
                    Toast.makeText(requireContext(), "Booking Confirmed!", Toast.LENGTH_SHORT).show()
                    // Navigate to tracking
                    parentFragmentManager.beginTransaction()
                        .replace(R.id.nav_host_fragment, OrderTrackingFragment())
                        .commit()
                }
                is OrderViewModel.OrderPlacementState.Error -> {
                    Toast.makeText(requireContext(), state.message, Toast.LENGTH_LONG).show()
                }
                else -> {}
            }
        }
    }

    private fun recalculatePrice() {
        val qty = binding.etQuantity.text.toString().toIntOrNull() ?: 1
        val selectedService = binding.spinnerService.selectedItem.toString()
        val estimated = orderViewModel.calculatePrice(qty, selectedService)
        binding.tvEstimatedPrice.text = String.format(Locale.getDefault(), "₹%.2f", estimated)
    }

    private fun showDatePicker() {
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, day ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, day)
            
            val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            binding.etPickupDate.setText(format.format(calendar.time))
        }

        DatePickerDialog(
            requireContext(),
            dateSetListener,
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun placeLaundryOrder() {
        val user = authViewModel.currentUserState.value
        if (user == null) {
            Toast.makeText(requireContext(), "Auth Session expired.", Toast.LENGTH_SHORT).show()
            return
        }

        val qtyStr = binding.etQuantity.text.toString().trim()
        val fabric = binding.etFabricType.text.toString().trim()
        val pickup = binding.etPickupDate.text.toString().trim()
        val service = binding.spinnerService.selectedItem.toString()

        if (qtyStr.isEmpty() || fabric.isEmpty() || pickup.isEmpty()) {
            Toast.makeText(requireContext(), "Please fill in all options", Toast.LENGTH_SHORT).show()
            return
        }

        val qty = qtyStr.toInt()
        val cost = orderViewModel.calculatePrice(qty, service)

        val order = Order(
            userId = user.userId,
            serviceType = service,
            fabricType = fabric,
            totalQuantity = qty,
            pickupDate = pickup,
            totalPrice = cost
        )

        orderViewModel.createOrder(order)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
