package com.smartlaundry.data.model

import com.google.firebase.firestore.DocumentId

data class Payment(
    @DocumentId val paymentId: String = "",
    val orderId: String = "",
    val userId: String = "",
    val amount: Double = 0.0,
    val paymentStatus: String = "Pending", // Options: "Pending", "Success", "Failed"
    val timestamp: Long = System.currentTimeMillis()
)
