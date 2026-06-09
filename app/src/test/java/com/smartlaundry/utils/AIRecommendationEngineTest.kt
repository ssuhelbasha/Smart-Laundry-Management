package com.smartlaundry.utils

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AIRecommendationEngineTest {

    @Test
    fun testSilkRecommendation() {
        val (method, reason) = AIRecommendationEngine.recommendBestWash("Banarasi Silk Saree")
        assertEquals(AIRecommendationEngine.WashingMethod.SILK_DELICATE, method)
        assertTrue(reason.contains("heat damage"))
    }

    @Test
    fun testWoolRecommendation() {
        val (method, reason) = AIRecommendationEngine.recommendBestWash("Winter Sweater Woolen")
        assertEquals(AIRecommendationEngine.WashingMethod.WOOL_SWEATERS, method)
        assertTrue(reason.contains("shrinking"))
    }

    @Test
    fun testJeansRecommendation() {
        val (method, reason) = AIRecommendationEngine.recommendBestWash("Blue Denim Jeans")
        assertEquals(AIRecommendationEngine.WashingMethod.HEAVY_JEANS, method)
        assertTrue(reason.contains("sturdy wash"))
    }

    @Test
    fun testGenericRecommendation() {
        val (method, reason) = AIRecommendationEngine.recommendBestWash("Cotton T-Shirt")
        assertEquals(AIRecommendationEngine.WashingMethod.COTTON_NORMAL, method)
        assertTrue(reason.contains("everyday daily wear"))
    }
}
