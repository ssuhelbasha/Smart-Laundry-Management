package com.smartlaundry.ui.viewmodel

import org.junit.Assert.assertEquals
import org.junit.Test

class OrderViewModelTest {

    // Simple test validation of pricing estimation equations without requiring Firestore mock bindings
    @Test
    fun testCalculateStandardWashPrice() {
        val viewModel = OrderViewModel() // Uses default parameters
        val price = viewModel.calculatePrice(quantity = 5, serviceType = "Standard Wash")
        // BasePrice = 2.0, Multiplier = 1.0 -> 5 * 2.0 * 1.0 = 10.0
        assertEquals(10.0, price, 0.001)
    }

    @Test
    fun testCalculateDryCleaningPrice() {
        val viewModel = OrderViewModel()
        val price = viewModel.calculatePrice(quantity = 3, serviceType = "Dry Cleaning")
        // BasePrice = 2.0, Multiplier = 1.5 -> 3 * 2.0 * 1.5 = 9.0
        assertEquals(9.0, price, 0.001)
    }

    @Test
    fun testCalculateIronPressPrice() {
        val viewModel = OrderViewModel()
        val price = viewModel.calculatePrice(quantity = 10, serviceType = "Iron / Press")
        // BasePrice = 2.0, Multiplier = 0.8 -> 10 * 2.0 * 0.8 = 16.0
        assertEquals(16.0, price, 0.001)
    }

    @Test
    fun testCalculateExpressWashPrice() {
        val viewModel = OrderViewModel()
        val price = viewModel.calculatePrice(quantity = 2, serviceType = "Express Wash")
        // BasePrice = 2.0, Multiplier = 1.8 -> 2 * 2.0 * 1.8 = 7.20
        assertEquals(7.20, price, 0.001)
    }
}
