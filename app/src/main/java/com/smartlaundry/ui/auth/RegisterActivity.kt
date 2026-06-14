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

            // Step 1: Request OTP
            viewModel.sendOtpForRegistration(email) { success ->
                if (success) {
                    showOtpDialog(user, password)
                } else {
                    Toast.makeText(this, "Failed to send OTP. Try again.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.tvLoginLink.setOnClickListener {
            finish()
        }
    }

    private fun showOtpDialog(user: User, password: String) {
        val input = android.widget.EditText(this)
        input.inputType = android.text.InputType.TYPE_CLASS_NUMBER
        input.hint = "Enter 6-digit OTP"
        
        android.app.AlertDialog.Builder(this)
            .setTitle("Verify Email")
            .setMessage("We've sent an OTP to ${user.email}. Please enter it below:")
            .setView(input)
            .setPositiveButton("Verify") { dialog, _ ->
                val otpCode = input.text.toString().trim()
                if (otpCode.length == 6) {
                    viewModel.registerUser(user, password, otpCode)
                } else {
                    Toast.makeText(this, "Invalid OTP format", Toast.LENGTH_SHORT).show()
                }
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.cancel()
            }
            .show()
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
