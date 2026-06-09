package com.smartlaundry.ui.admin

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartlaundry.databinding.ActivityAdminDashboardBinding
import com.smartlaundry.ui.auth.LoginActivity
import com.smartlaundry.ui.viewmodel.AdminViewModel
import com.smartlaundry.ui.viewmodel.AuthViewModel

class AdminDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminDashboardBinding
    private val authViewModel: AuthViewModel by viewModels()
    private val adminViewModel: AdminViewModel by viewModels()
    private lateinit var orderAdapter: AdminOrderAdapter
    private lateinit var userAdapter: AdminUserAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup Orders Recycler
        binding.rvAdminOrders.layoutManager = LinearLayoutManager(this)
        orderAdapter = AdminOrderAdapter(emptyList()) { orderId, newStatus ->
            adminViewModel.updateOrderStatus(orderId, newStatus)
        }
        binding.rvAdminOrders.adapter = orderAdapter

        // Setup Users Recycler
        binding.rvAdminUsers.layoutManager = LinearLayoutManager(this)
        userAdapter = AdminUserAdapter(emptyList())
        binding.rvAdminUsers.adapter = userAdapter

        // Drawer Toggle
        binding.btnMenuToggle.setOnClickListener {
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }

        // Navigation View Toggles
        binding.btnNavOverview.setOnClickListener { switchView("overview") }
        binding.btnNavTasks.setOnClickListener { switchView("tasks") }
        binding.btnNavUsers.setOnClickListener { switchView("users") }

        // Fetch admin profile
        authViewModel.currentUserState.observe(this) { user ->
            if (user != null) {
                binding.tvAdminTitle.text = "Admin: ${user.name}"
            }
        }
        authViewModel.checkCurrentUser()

        // Observe all platform orders
        adminViewModel.allOrders.observe(this) { orders ->
            orderAdapter.updateList(orders)
            binding.tvTotalOrders.text = "${orders.size} Orders"
        }
        
        // Observe all platform users
        adminViewModel.allUsers.observe(this) { users ->
            userAdapter.updateList(users)
        }

        // Observe revenue analytics
        adminViewModel.totalRevenue.observe(this) { total ->
            binding.tvTotalRevenue.text = String.format("₹%.2f", total)
        }

        // Observe prices adjustments updates
        adminViewModel.basePrice.observe(this) { price ->
            binding.etBasePrice.setText(String.format("%.2f", price))
        }

        binding.btnUpdatePrice.setOnClickListener {
            val priceStr = binding.etBasePrice.text.toString().trim()
            if (priceStr.isEmpty()) {
                Toast.makeText(this, "Please enter a valid price", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val price = priceStr.toDoubleOrNull()
            if (price == null || price <= 0) {
                Toast.makeText(this, "Please enter a positive value", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            adminViewModel.modifyBasePrice(price)
        }

        adminViewModel.pricingUpdateStatus.observe(this) { success ->
            if (success) {
                Toast.makeText(this, "Global price updated!", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Failed to adjust prices.", Toast.LENGTH_SHORT).show()
            }
        }

        // Logout
        binding.btnLogout.setOnClickListener {
            authViewModel.logoutUser()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }
    }
    
    private fun switchView(viewName: String) {
        binding.viewOverview.visibility = View.GONE
        binding.viewTasks.visibility = View.GONE
        binding.viewUsers.visibility = View.GONE
        
        when(viewName) {
            "overview" -> binding.viewOverview.visibility = View.VISIBLE
            "tasks" -> binding.viewTasks.visibility = View.VISIBLE
            "users" -> binding.viewUsers.visibility = View.VISIBLE
        }
        binding.drawerLayout.closeDrawer(GravityCompat.START)
    }
}
