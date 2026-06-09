package com.smartlaundry.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.smartlaundry.data.model.User
import com.smartlaundry.databinding.ActivityRegisterBinding
import com.smartlaundry.ui.admin.AdminDashboardActivity
import com.smartlaundry.ui.customer.CustomerDashboardActivity
import com.smartlaundry.ui.staff.StaffDashboardActivity
import com.smartlaundry.ui.viewmodel.AuthViewModel

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel.authState.observe(this) { state ->
            when (state) {
                is AuthViewModel.AuthState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnRegister.isEnabled = false
                }
                is AuthViewModel.AuthState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                    Toast.makeText(this, "Registration Successful! Please log in with your credentials.", Toast.LENGTH_LONG).show()
                    finish() // Return to LoginActivity
                }
                is AuthViewModel.AuthState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                }
                else -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                }
            }
        }

        binding.btnRegister.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val phone = binding.etPhone.text.toString().trim()
            val address = binding.etAddress.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (name.isEmpty() || email.isEmpty() || phone.isEmpty() || address.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill out all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val role = when (binding.rgRole.checkedRadioButtonId) {
                binding.rbStaff.id -> "staff"
                else -> "customer"
            }

            val user = User(
                name = name,
                email = email,
                phone = phone,
                address = address,
                role = role
            )

            viewModel.registerUser(user, password)
        }

        binding.tvLoginLink.setOnClickListener {
            finish()
        }
    }

    private fun routeUserByRole(role: String) {
        val intent = when (role.lowercase()) {
            "admin" -> Intent(this, AdminDashboardActivity::class.java)
            "staff" -> Intent(this, StaffDashboardActivity::class.java)
            else    -> Intent(this, CustomerDashboardActivity::class.java)
        }
        startActivity(intent)
        finishAffinity() // Clear activity backstack
    }
}
