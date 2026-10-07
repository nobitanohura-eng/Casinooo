package com.papatransport.smsgateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class SmsGatewayService : Service() {

    companion object {
        const val CHANNEL_ID = "papa_transport_sms_channel"
        const val NOTIFICATION_ID = 1001
        private const val TAG = "SmsGatewayService"

        var isRunning = false
        var isPaused = false
        var lastStatusMessage = "Service started"
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var wakeLock: PowerManager.WakeLock? = null
    private lateinit var apiClient: ApiClient
    private lateinit var smsSender: SmsSender

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        smsSender = SmsSender(this)

        val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "http://10.108.104.221:3000") ?: ""
        val token = prefs.getString("device_token", "") ?: ""
        apiClient = ApiClient(serverUrl, token)

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PapaTransport::SmsWakeLock").apply {
            acquire(10 * 60 * 1000L /* 10 min */)
        }

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("SMS Gateway Active - Connected to Papa Transport"))

        startJobPollingLoop()
        startHeartbeatLoop()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Papa Transport SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background SMS worker and device sync service"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🚚 Papa Transport SMS Gateway")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startJobPollingLoop() {
        serviceScope.launch {
            while (isActive) {
                if (!isPaused) {
                    try {
                        val jobs = apiClient.pollPendingJobs()
                        if (jobs.isNotEmpty()) {
                            Log.i(TAG, "Fetched ${jobs.size} pending SMS jobs from server")
                            for (job in jobs) {
                                processJob(job)
                                delay(12000L) // 12 second throttle between individual SIM dispatches
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Polling loop error: ${e.message}")
                    }
                }
                delay(15000L) // Poll interval: 15 seconds
            }
        }
    }

    private fun processJob(job: SmsJobModel) {
        val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
        val selectedSubId = prefs.getInt("selected_sub_id", -1)

        lastStatusMessage = "Sending SMS to ${job.leadName} (${job.phone})..."
        updateNotification(lastStatusMessage)

        smsSender.sendSms(job.phone, job.messageText, selectedSubId, job.id) { success, errCode, errMsg ->
            serviceScope.launch {
                if (success) {
                    apiClient.reportJob(job.id, "sent")
                    lastStatusMessage = "Sent to ${job.leadName}"
                } else {
                    apiClient.reportJob(job.id, "failed", errCode, errMsg)
                    lastStatusMessage = "Failed sending to ${job.leadName}: $errMsg"
                }
                updateNotification(lastStatusMessage)
            }
        }
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (isActive) {
                try {
                    val batteryIntent = registerReceiver(null, android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED))
                    val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 100
                    val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
                    val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale) else 100
                    val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
                    val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

                    val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
                    val simSlot = prefs.getInt("selected_sim_slot", 0)
                    val carrier = prefs.getString("selected_carrier", "SIM Card") ?: "SIM Card"

                    apiClient.sendHeartbeat(batteryPct, isCharging, simSlot, carrier)
                } catch (e: Exception) {
                    Log.e(TAG, "Heartbeat failed: ${e.message}")
                }
                delay(60000L) // Heartbeat every 60 seconds
            }
        }
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager?.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
