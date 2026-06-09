package com.smartlaundry.data.model

import com.google.firebase.firestore.DocumentId

data class User(
    @DocumentId val userId: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    val role: String = "customer" // Options: "customer", "staff", "admin"
)
