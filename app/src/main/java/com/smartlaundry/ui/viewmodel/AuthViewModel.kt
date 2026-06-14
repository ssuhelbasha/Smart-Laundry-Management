package com.smartlaundry.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartlaundry.data.model.User
import com.smartlaundry.data.repository.UserRepository
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: UserRepository = UserRepository()) : ViewModel() {

    private val _authState = MutableLiveData<AuthState>()
    val authState: LiveData<AuthState> get() = _authState

    private val _currentUserState = MutableLiveData<User?>()
    val currentUserState: LiveData<User?> get() = _currentUserState

    fun checkCurrentUser() {
        viewModelScope.launch {
            val user = repository.getCurrentUser()
            _currentUserState.value = user
        }
    }

    fun loginUser(email: String, password: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                val user = repository.login(email, password)
                if (user != null) {
                    _authState.value = AuthState.Success(user)
                } else {
                    _authState.value = AuthState.Error("Invalid login credentials")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _authState.value = AuthState.Error("Invalid login credentials")
            }
        }
    }

    fun sendOtpForRegistration(email: String, onResult: (Boolean) -> Unit) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                val success = repository.sendOtp(email, "registration")
                _authState.value = AuthState.Idle // Reset state after sending
                onResult(success)
            } catch (e: Exception) {
                e.printStackTrace()
                _authState.value = AuthState.Idle
                onResult(false)
            }
        }
    }

    fun registerUser(user: User, password: String, otpCode: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                val success = repository.register(user, password, otpCode)
                if (success) {
                    _authState.value = AuthState.Success(user)
                } else {
                    _authState.value = AuthState.Error("Registration failed. Please check the OTP and try again.")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _authState.value = AuthState.Error("Registration failed. Please try again.")
            }
        }
    }

    fun logoutUser() {
        repository.logout()
        _currentUserState.value = null
        _authState.value = AuthState.LoggedOut
    }

    sealed class AuthState {
        object Idle : AuthState()
        object Loading : AuthState()
        data class Success(val user: User) : AuthState()
        data class Error(val message: String) : AuthState()
        object LoggedOut : AuthState()
    }
}
