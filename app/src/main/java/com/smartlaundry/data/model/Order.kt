package com.smartlaundry.data.model

import com.google.firebase.firestore.DocumentId

data class Order(
    @DocumentId val orderId: String = "",
    val userId: String = "",
    val serviceType: String = "",
    val fabricType: String = "",
    val totalQuantity: Int = 0,
    val pickupDate: String = "",
    val status: String = "Pickup Pending", // Options: "Pickup Pending", "Picked Up", "Washing", "Ironing", "Ready", "Delivered"
    val totalPrice: Double = 0.0,
    val paymentStatus: String = "Pending", // Options: "Pending", "Paid"
    val assignedStaffId: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
