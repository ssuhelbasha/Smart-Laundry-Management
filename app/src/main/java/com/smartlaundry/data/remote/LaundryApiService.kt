package com.smartlaundry.data.remote

import com.smartlaundry.data.model.Order
import retrofit2.http.*

interface LaundryApiService {

    @POST("api/auth/login")
    suspend fun login(@Body credentials: Map<String, String>): Map<String, Any>

    @POST("api/auth/register")
    suspend fun register(@Body registrationDetails: Map<String, String>): Map<String, Any>

    @POST("api/auth/send-otp")
    suspend fun sendOtp(@Body requestBody: Map<String, String>): Map<String, Any>

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body requestBody: Map<String, String>): Map<String, Any>

    @POST("api/auth/reset-password")
    suspend fun resetPassword(@Body requestBody: Map<String, String>): Map<String, Any>

    @GET("api/orders")
    suspend fun getOrders(
        @Query("userId") userId: String? = null,
        @Query("staffId") staffId: String? = null
    ): List<Order>

    @POST("api/orders")
    suspend fun createOrder(@Body order: Order): Map<String, Any>

    @PUT("api/orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") orderId: String,
        @Body statusDetails: Map<String, String>
    ): Map<String, Any>

    @GET("api/pricing")
    suspend fun getPricing(): Map<String, Any>

    @GET("api/users")
    suspend fun getUsers(): List<com.smartlaundry.data.model.User>
}
