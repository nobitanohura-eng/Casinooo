package com.papatransport.smsgateway

import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClient(private val serverUrl: String, private val token: String? = null) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    // 1. Complete pairing using 6-digit PIN
    fun pairDevice(
        pin: String,
        deviceName: String,
        deviceModel: String,
        phoneNumber: String,
        simCarrier: String,
        simCount: Int
    ): Pair<Boolean, String> {
        val payload = JSONObject().apply {
            put("pin", pin)
            put("device_name", deviceName)
            put("device_model", deviceModel)
            put("phone_number", phoneNumber)
            put("sim_carrier", simCarrier)
            put("sim_count", simCount)
            put("app_version", "1.0.0")
        }

        val request = Request.Builder()
            .url("$serverUrl/api/sms/pair/complete")
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        return try {
            val response = client.newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""
            if (response.isSuccessful) {
                val json = JSONObject(bodyStr)
                val token = json.optString("token", "")
                Pair(true, token)
            } else {
                val err = JSONObject(bodyStr).optString("error", "Pairing failed")
                Pair(false, err)
            }
        } catch (e: Exception) {
            Pair(false, e.message ?: "Connection error")
        }
    }

    // 2. Poll for pending queued jobs
    fun pollPendingJobs(): List<SmsJobModel> {
        if (token.isNullOrEmpty()) return emptyList()

        val request = Request.Builder()
            .url("$serverUrl/api/sms/device/poll")
            .header("Authorization", "Bearer $token")
            .get()
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return emptyList()
            val bodyStr = response.body?.string() ?: ""
            val json = JSONObject(bodyStr)
            val jobsArray = json.optJSONArray("jobs") ?: JSONArray()
            val list = mutableListOf<SmsJobModel>()

            for (i in 0 until jobsArray.length()) {
                val obj = jobsArray.getJSONObject(i)
                list.add(
                    SmsJobModel(
                        id = obj.getString("id"),
                        leadId = obj.getString("lead_id"),
                        leadName = obj.optString("lead_company_name", "Lead"),
                        phone = obj.getString("recipient_phone"),
                        messageText = obj.getString("message_text"),
                        simSlot = obj.optInt("sim_slot", 0)
                    )
                )
            }
            list
        } catch (e: Exception) {
            Log.e("ApiClient", "Poll failed: ${e.message}")
            emptyList()
        }
    }

    // 3. Heartbeat
    fun sendHeartbeat(batteryLevel: Int, isCharging: Boolean, simSlot: Int, carrier: String): Boolean {
        if (token.isNullOrEmpty()) return false

        val payload = JSONObject().apply {
            put("battery_level", batteryLevel)
            put("is_charging", isCharging)
            put("selected_sim_slot", simSlot)
            put("sim_carrier", carrier)
        }

        val request = Request.Builder()
            .url("$serverUrl/api/sms/device/heartbeat")
            .header("Authorization", "Bearer $token")
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        return try {
            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    // 4. Report job result
    fun reportJob(
        jobId: String,
        status: String,
        errorCode: String? = null,
        errorMessage: String? = null
    ): Boolean {
        if (token.isNullOrEmpty()) return false

        val payload = JSONObject().apply {
            put("job_id", jobId)
            put("status", status)
            if (errorCode != null) put("error_code", errorCode)
            if (errorMessage != null) put("error_message", errorMessage)
        }

        val request = Request.Builder()
            .url("$serverUrl/api/sms/device/report")
            .header("Authorization", "Bearer $token")
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        return try {
            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            Log.e("ApiClient", "Report job failed: ${e.message}")
            false
        }
    }
}

data class SmsJobModel(
    val id: String,
    val leadId: String,
    val leadName: String,
    val phone: String,
    val messageText: String,
    val simSlot: Int
)
