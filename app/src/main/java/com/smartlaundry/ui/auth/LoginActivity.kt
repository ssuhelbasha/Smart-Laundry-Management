package com.smartlaundry.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.smartlaundry.databinding.ActivityLoginBinding
import com.smartlaundry.ui.admin.AdminDashboardActivity
import com.smartlaundry.ui.customer.CustomerDashboardActivity
import com.smartlaundry.ui.staff.StaffDashboardActivity
import com.smartlaundry.ui.viewmodel.AuthViewModel

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Pre-fill demo credentials
        binding.etEmail.setText("shaiksuhelbasha609@gmail.com")
        binding.etPassword.setText("123")

        // Check if user is already logged in
        viewModel.currentUserState.observe(this) { user ->
            if (user != null) {
                routeUserByRole(user.role)
            }
        }
        viewModel.checkCurrentUser()

        // Handle login state updates
        viewModel.authState.observe(this) { state ->
            when (state) {
                is AuthViewModel.AuthState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnLogin.isEnabled = false
                }
                is AuthViewModel.AuthState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnLogin.isEnabled = true
                    Toast.makeText(this, "Welcome, ${state.user.name}!", Toast.LENGTH_SHORT).show()
                    routeUserByRole(state.user.role)
                }
                is AuthViewModel.AuthState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnLogin.isEnabled = true
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                }
                else -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnLogin.isEnabled = true
                }
            }
        }

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            viewModel.loginUser(email, password)
        }

        binding.tvRegisterLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun routeUserByRole(role: String) {
        val intent = when (role.lowercase()) {
            "admin" -> Intent(this, AdminDashboardActivity::class.java)
            "staff" -> Intent(this, StaffDashboardActivity::class.java)
            else    -> Intent(this, CustomerDashboardActivity::class.java)
        }
        startActivity(intent)
        finish()
    }
}
