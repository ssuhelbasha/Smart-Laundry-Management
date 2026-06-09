package com.smartlaundry.data.remote
 
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
 
object RetrofitClient {
    // 💡 OPTION A: Use this URL for Android Emulator (100% Guaranteed to work instantly!)
    private const val BASE_URL = "http://10.0.2.2:3000/"
 
    // 💡 OPTION B: Use this URL for Physical Phone (Uncomment and replace with your Mobile Hotspot PC IP)
    // private const val BASE_URL = "http://10.192.25.135:3000/"
 
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(2, TimeUnit.SECONDS)
        .writeTimeout(2, TimeUnit.SECONDS)
        .build()
 
    val apiService: LaundryApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(LaundryApiService::class.java)
    }
}
