package com.smartlaundry.utils

object AIRecommendationEngine {

    enum class WashingMethod(val description: String, val baseMultiplier: Double) {
        SILK_DELICATE("Hand-Wash Cool or Premium Dry Cleaning only. Prevents shrink.", 1.5),
        COTTON_NORMAL("Normal Hot Water cycle. Tumble dry normal.", 1.0),
        WOOL_SWEATERS("Flat air-dry, cold water soak. Gentle spin only.", 1.3),
        HEAVY_JEANS("Heavy duty spin, safe with standard fabric softener.", 1.1)
    }

    fun recommendBestWash(clothesType: String): Pair<WashingMethod, String> {
        val normalizedType = clothesType.lowercase().trim()
        return when {
            normalizedType.contains("silk") || normalizedType.contains("saree") -> 
                Pair(WashingMethod.SILK_DELICATE, "Delicate silks suffer heat damage easily.")
            normalizedType.contains("wool") || normalizedType.contains("sweater") -> 
                Pair(WashingMethod.WOOL_SWEATERS, "Prevent wool shrinking using flat drying.")
            normalizedType.contains("jean") || normalizedType.contains("denim") -> 
                Pair(WashingMethod.HEAVY_JEANS, "Sturdy wash cycle ideal for heavy canvas.")
            else -> 
                Pair(WashingMethod.COTTON_NORMAL, "Perfect for standard everyday daily wear.")
        }
    }
}
