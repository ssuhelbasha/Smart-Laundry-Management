package com.smartlaundry.ui.staff

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions
import com.smartlaundry.databinding.ActivityStaffDashboardBinding
import com.smartlaundry.ui.auth.LoginActivity
import com.smartlaundry.ui.viewmodel.AuthViewModel
import com.smartlaundry.ui.viewmodel.OrderViewModel

class StaffDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityStaffDashboardBinding
    private val authViewModel: AuthViewModel by viewModels()
    private val orderViewModel: OrderViewModel by viewModels()
    private lateinit var adapter: StaffOrderAdapter
    private var staffId: String = ""

    // ZXing QR barcode scanner launcher
    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents != null) {
            val scannedOrderId = result.contents
            orderViewModel.confirmDeliveryByQR(scannedOrderId, staffId)
            Toast.makeText(this, "QR Code Verified! Order delivered successfully.", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(this, "Scanning cancelled", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityStaffDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup recycler view
        binding.rvStaffOrders.layoutManager = LinearLayoutManager(this)
        adapter = StaffOrderAdapter(emptyList()) { order ->
            orderViewModel.advanceOrderState(order, staffId)
        }
        binding.rvStaffOrders.adapter = adapter

        // Fetch staff profile session
        authViewModel.currentUserState.observe(this) { user ->
            if (user != null) {
                staffId = user.userId
                binding.tvStaffTitle.text = "Hello, ${user.name}"
                orderViewModel.loadStaffOrders(staffId)
            }
        }
        authViewModel.checkCurrentUser()

        // Load active workload orders
        orderViewModel.staffOrders.observe(this) { orders ->
            adapter.updateList(orders)
        }

        // Trigger QR Scanner camera
        binding.btnScanQR.setOnClickListener {
            val options = ScanOptions().apply {
                setPrompt("Scan customer's Delivery Verification QR Code")
                setCameraId(0) // Back camera
                setBeepEnabled(true)
                setBarcodeImageEnabled(true)
                setOrientationLocked(false)
            }
            barcodeLauncher.launch(options)
        }

        // Logout
        binding.btnLogout.setOnClickListener {
            authViewModel.logoutUser()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }
    }
}
