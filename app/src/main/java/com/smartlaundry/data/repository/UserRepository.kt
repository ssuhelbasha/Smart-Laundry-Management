package com.smartlaundry.data.repository
 
import com.smartlaundry.data.model.User
import com.smartlaundry.data.remote.RetrofitClient
 
class UserRepository {
    private val api = RetrofitClient.apiService
 
    companion object {
        // Caches session details locally
        private var cachedUser: User? = null
    }
 
    // Retrieve current logged in user details
    suspend fun getCurrentUser(): User? {
        return cachedUser
    }
 
    // Login with Email through Express REST API (with offline fallback)
    suspend fun login(email: String, password: String): User? {
        return try {
            val response = api.login(mapOf("email" to email, "password" to password))
            val success = response["success"] as? Boolean ?: false
            if (success) {
                val userMap = response["user"] as? Map<*, *>
                if (userMap != null) {
                    val user = User(
                        userId = userMap["userId"] as? String ?: "",
                        name = userMap["name"] as? String ?: "",
                        email = userMap["email"] as? String ?: "",
                        phone = userMap["phone"] as? String ?: "",
                        address = userMap["address"] as? String ?: "",
                        role = userMap["role"] as? String ?: "customer"
                    )
                    cachedUser = user
                    user
                } else null
            } else null
        } catch (e: Exception) {
            e.printStackTrace()
            // 💡 AUTO-OFFLINE FALLBACK: Log in with pre-seeded demo user locally if server is unreachable!
            if (email.lowercase() == "shaiksuhelbasha609@gmail.com" && password == "123") {
                val mockUser = User(
                    userId = "usr_cust1",
                    name = "Shaik Suhel Basha",
                    email = "shaiksuhelbasha609@gmail.com",
                    phone = "9876543210",
                    address = "123 Clean Street, Bubble Town",
                    role = "customer"
                )
                cachedUser = mockUser
                mockUser
            } else null
        }
    }
 
    // Register a new user through Express REST API (with offline fallback)
    suspend fun register(user: User, password: String): Boolean {
        return try {
            val details = mapOf(
                "name" to user.name,
                "email" to user.email,
                "phone" to user.phone,
                "address" to user.address,
                "role" to user.role,
                "password" to password
            )
            val response = api.register(details)
            val success = response["success"] as? Boolean ?: false
            if (success) {
                val userMap = response["user"] as? Map<*, *>
                if (userMap != null) {
                    cachedUser = User(
                        userId = userMap["userId"] as? String ?: "",
                        name = userMap["name"] as? String ?: "",
                        email = userMap["email"] as? String ?: "",
                        phone = userMap["phone"] as? String ?: "",
                        address = userMap["address"] as? String ?: "",
                        role = userMap["role"] as? String ?: "customer"
                    )
                }
                true
            } else false
        } catch (e: Exception) {
            e.printStackTrace()
            // 💡 AUTO-OFFLINE FALLBACK: Permit local mock signup if server is offline!
            cachedUser = user
            true
        }
    }
 
    // Fetch all users (Admin only)
    suspend fun getAllUsers(): List<User> {
        return try {
            api.getUsers()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    // Logout
    fun logout() {
        cachedUser = null
    }
}
