package com.papatransport.smsgateway

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log

class SmsSender(private val context: Context) {

    companion object {
        const val ACTION_SMS_SENT = "com.papatransport.smsgateway.SMS_SENT"
        const val ACTION_SMS_DELIVERED = "com.papatransport.smsgateway.SMS_DELIVERED"
        private const val TAG = "SmsSender"
    }

    // Get list of active SIM cards
    fun getAvailableSims(): List<SimCardInfo> {
        val list = mutableListOf<SimCardInfo>()
        try {
            val subManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val subList = subManager?.activeSubscriptionInfoList
            if (subList != null && subList.isNotEmpty()) {
                for (info in subList) {
                    list.add(
                        SimCardInfo(
                            subscriptionId = info.subscriptionId,
                            simSlotIndex = info.simSlotIndex,
                            displayName = "${info.displayName} (SIM ${info.simSlotIndex + 1})",
                            carrierName = info.carrierName?.toString() ?: "Unknown Carrier"
                        )
                    )
                }
            } else {
                list.add(SimCardInfo(-1, 0, "Default Device SIM", "Carrier SIM"))
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission missing for SubscriptionManager: ${e.message}")
            list.add(SimCardInfo(-1, 0, "Default Device SIM", "Carrier SIM"))
        }
        return list
    }

    // Send SMS with selected subscription ID
    fun sendSms(
        recipientPhone: String,
        message: String,
        subscriptionId: Int,
        jobId: String,
        onResult: (success: Boolean, errorCode: String?, errorMessage: String?) -> Unit
    ) {
        val smsManager: SmsManager = if (subscriptionId != -1 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java).createForSubscriptionId(subscriptionId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
            }
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }

        val sentAction = "$ACTION_SMS_SENT.$jobId"
        val deliveredAction = "$ACTION_SMS_DELIVERED.$jobId"

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val sentIntent = PendingIntent.getBroadcast(context, jobId.hashCode(), Intent(sentAction), flags)
        val deliveredIntent = PendingIntent.getBroadcast(context, jobId.hashCode(), Intent(deliveredAction), flags)

        // Register one-time receiver for sent outcome
        val sentReceiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                try {
                    context.unregisterReceiver(this)
                } catch (_: Exception) {}

                when (resultCode) {
                    Activity.RESULT_OK -> {
                        Log.i(TAG, "Job $jobId sent successfully by Android radio")
                        onResult(true, null, null)
                    }
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> {
                        onResult(false, "RESULT_ERROR_GENERIC_FAILURE", "Carrier or balance rejection")
                    }
                    SmsManager.RESULT_ERROR_NO_SERVICE -> {
                        onResult(false, "RESULT_ERROR_NO_SERVICE", "No cellular network service")
                    }
                    SmsManager.RESULT_ERROR_NULL_PDU -> {
                        onResult(false, "RESULT_ERROR_NULL_PDU", "Null PDU error")
                    }
                    SmsManager.RESULT_ERROR_RADIO_OFF -> {
                        onResult(false, "RESULT_ERROR_RADIO_OFF", "Airplane mode or radio turned off")
                    }
                    else -> {
                        onResult(false, "UNKNOWN_ERROR_$resultCode", "Unknown carrier result code: $resultCode")
                    }
                }
            }
        }

        val filter = IntentFilter(sentAction)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(sentReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(sentReceiver, filter)
        }

        try {
            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                val sentIntents = ArrayList<PendingIntent>()
                val deliveredIntents = ArrayList<PendingIntent>()
                for (i in 0 until parts.size) {
                    sentIntents.add(sentIntent)
                    deliveredIntents.add(deliveredIntent)
                }
                smsManager.sendMultipartTextMessage(recipientPhone, null, parts, sentIntents, deliveredIntents)
            } else {
                smsManager.sendTextMessage(recipientPhone, null, message, sentIntent, deliveredIntent)
            }
        } catch (e: Exception) {
            try {
                context.unregisterReceiver(sentReceiver)
            } catch (_: Exception) {}
            onResult(false, "DISPATCH_EXCEPTION", e.message ?: "Failed to invoke SmsManager")
        }
    }
}

data class SimCardInfo(
    val subscriptionId: Int,
    val simSlotIndex: Int,
    val displayName: String,
    val carrierName: String
)
