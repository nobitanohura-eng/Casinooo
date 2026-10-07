package com.papatransport.smsgateway

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    private val activityScope = CoroutineScope(Dispatchers.Main + Job())
    private lateinit var smsSender: SmsSender

    // Views
    private lateinit var layoutPairing: LinearLayout
    private lateinit var layoutConnected: LinearLayout
    private lateinit var editServerUrl: EditText
    private lateinit var editPairingPin: EditText
    private lateinit var btnPair: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvDeviceModel: TextView
    private lateinit var spinnerSim: Spinner
    private lateinit var switchPause: Switch
    private lateinit var btnSyncNow: Button
    private lateinit var btnUnpair: Button
    private lateinit var tvLog: TextView
    private lateinit var scrollViewLog: ScrollView

    private val logBuilder = StringBuilder()
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    companion object {
        private const val PERMISSION_REQUEST_CODE = 2001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createProgrammaticLayout())

        smsSender = SmsSender(this)
        checkAndRequestPermissions()
        requestBatteryOptimizationExemption()

        val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
        val isPaired = prefs.getBoolean("is_paired", false)

        if (isPaired) {
            showConnectedUi()
            startServiceIfPaired()
        } else {
            showPairingUi()
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (_: Exception) {}
            }
        }
    }

    private fun startServiceIfPaired() {
        val intent = Intent(this, SmsGatewayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        appendLog("SmsGatewayService active in background.")
    }

    private fun performPairing() {
        val serverUrl = editServerUrl.text.toString().trim().removeSuffix("/")
        val pin = editPairingPin.text.toString().trim()

        if (serverUrl.isEmpty() || pin.length != 6) {
            Toast.makeText(this, "Enter valid server URL & 6-digit PIN", Toast.LENGTH_SHORT).show()
            return
        }

        btnPair.isEnabled = false
        btnPair.text = "Pairing with server..."
        appendLog("Initiating pairing with $serverUrl using PIN $pin")

        activityScope.launch(Dispatchers.IO) {
            val deviceName = "${Build.MANUFACTURER.replaceFirstChar { it.uppercase() }} ${Build.MODEL}"
            val deviceModel = Build.MODEL
            val sims = smsSender.getAvailableSims()
            val carrier = sims.firstOrNull()?.carrierName ?: "SIM 1"

            val client = ApiClient(serverUrl)
            val (success, result) = client.pairDevice(
                pin = pin,
                deviceName = deviceName,
                deviceModel = deviceModel,
                phoneNumber = "",
                simCarrier = carrier,
                simCount = sims.size
            )

            withContext(Dispatchers.Main) {
                btnPair.isEnabled = true
                btnPair.text = "Pair Phone"

                if (success) {
                    val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
                    prefs.edit()
                        .putBoolean("is_paired", true)
                        .putString("server_url", serverUrl)
                        .putString("device_token", result)
                        .putString("device_name", deviceName)
                        .apply()

                    appendLog("Pairing successful! Token received.")
                    showConnectedUi()
                    startServiceIfPaired()
                } else {
                    appendLog("Pairing error: $result")
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("Pairing Failed")
                        .setMessage(result)
                        .setPositiveButton("OK", null)
                        .show()
                }
            }
        }
    }

    private fun showPairingUi() {
        layoutPairing.visibility = View.VISIBLE
        layoutConnected.visibility = View.GONE
    }

    private fun showConnectedUi() {
        layoutPairing.visibility = View.GONE
        layoutConnected.visibility = View.VISIBLE

        val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
        val devName = prefs.getString("device_name", "${Build.MANUFACTURER} ${Build.MODEL}")
        tvDeviceModel.text = devName
        tvStatus.text = "🟢 Connected & Active"

        setupSimSelector()
    }

    private fun setupSimSelector() {
        val sims = smsSender.getAvailableSims()
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, sims.map { "${it.displayName} (${it.carrierName})" })
        spinnerSim.adapter = adapter

        spinnerSim.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p0: AdapterView<*>?, p1: View?, position: Int, p3: Long) {
                val selected = sims[position]
                val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
                prefs.edit()
                    .putInt("selected_sub_id", selected.subscriptionId)
                    .putInt("selected_sim_slot", selected.simSlotIndex)
                    .putString("selected_carrier", selected.carrierName)
                    .apply()
                appendLog("Active SIM set to: ${selected.displayName}")
            }
            override fun onNothingSelected(p0: AdapterView<*>?) {}
        }
    }

    private fun unpairDevice() {
        AlertDialog.Builder(this)
            .setTitle("Unpair Device?")
            .setMessage("This phone will stop sending SMS messages for Papa Transport.")
            .setPositiveButton("Yes, Unpair") { _, _ ->
                stopService(Intent(this, SmsGatewayService::class.java))
                val prefs = getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE)
                prefs.edit().clear().apply()
                appendLog("Device unpaired.")
                showPairingUi()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun appendLog(msg: String) {
        val line = "[${timeFormat.format(Date())}] $msg\n"
        logBuilder.append(line)
        runOnUiThread {
            tvLog.text = logBuilder.toString()
            scrollViewLog.fullScroll(View.FOCUS_DOWN)
        }
    }

    // Programmatic Material Design UI without needing external layout files
    private fun createProgrammaticLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 48, 32, 32)
            setBackgroundColor(0xFFF8F9FA.toInt())
        }

        val header = TextView(this).apply {
            text = "🚚 Papa Transport SMS Gateway"
            textSize = 20f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(0xFF1E293B.toInt())
            setPadding(0, 0, 0, 8)
        }
        val subheader = TextView(this).apply {
            text = "Android Phone + SIM Card Gateway for Local Leads Follow-up"
            textSize = 12f
            setTextColor(0xFF64748B.toInt())
            setPadding(0, 0, 0, 24)
        }
        root.addView(header)
        root.addView(subheader)

        // 1. PAIRING LAYOUT
        layoutPairing = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }

        val tvInstruction = TextView(this).apply {
            text = "Step 1: Enter your Dashboard Server URL and the 6-Digit PIN shown on your web dashboard to pair this device."
            textSize = 14f
            setTextColor(0xFF334155.toInt())
            setPadding(0, 0, 0, 16)
        }
        layoutPairing.addView(tvInstruction)

        editServerUrl = EditText(this).apply {
            hint = "Server URL (e.g. http://10.108.104.221:3000)"
            setText("http://10.108.104.221:3000")
            setPadding(24, 24, 24, 24)
            setBackgroundColor(0xFFFFFFFF.toInt())
        }
        layoutPairing.addView(editServerUrl)

        editPairingPin = EditText(this).apply {
            hint = "6-Digit Pairing PIN (from Dashboard)"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            setPadding(24, 24, 24, 24)
            setBackgroundColor(0xFFFFFFFF.toInt())
        }
        layoutPairing.addView(editPairingPin)

        btnPair = Button(this).apply {
            text = "🔗 Pair This Android Phone"
            setBackgroundColor(0xFF2563EB.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener { performPairing() }
        }
        layoutPairing.addView(btnPair)
        root.addView(layoutPairing)

        // 2. CONNECTED LAYOUT
        layoutConnected = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
        }

        tvDeviceModel = TextView(this).apply {
            textSize = 16f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(0xFF0F172A.toInt())
        }
        tvStatus = TextView(this).apply {
            textSize = 14f
            setTextColor(0xFF16A34A.toInt())
            setPadding(0, 4, 0, 16)
        }
        layoutConnected.addView(tvDeviceModel)
        layoutConnected.addView(tvStatus)

        val tvSimLabel = TextView(this).apply {
            text = "Selected Dispatch SIM:"
            textSize = 12f
            setTextColor(0xFF64748B.toInt())
        }
        spinnerSim = Spinner(this)
        layoutConnected.addView(tvSimLabel)
        layoutConnected.addView(spinnerSim)

        switchPause = Switch(this).apply {
            text = "Pause SMS Sending (Standby)"
            isChecked = false
            setOnCheckedChangeListener { _, checked ->
                SmsGatewayService.isPaused = checked
                appendLog(if (checked) "SMS Gateway PAUSED by user." else "SMS Gateway RESUMED.")
            }
        }
        layoutConnected.addView(switchPause)

        btnSyncNow = Button(this).apply {
            text = "⚡ Check & Sync Pending Jobs Now"
            setBackgroundColor(0xFF0F766E.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                appendLog("Manual sync triggered.")
                startServiceIfPaired()
            }
        }
        layoutConnected.addView(btnSyncNow)

        btnUnpair = Button(this).apply {
            text = "Revoke & Disconnect"
            setBackgroundColor(0xFFDC2626.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener { unpairDevice() }
        }
        layoutConnected.addView(btnUnpair)
        root.addView(layoutConnected)

        // 3. LOG AREA
        val tvLogHeader = TextView(this).apply {
            text = "Live Activity & SMS Logs:"
            textSize = 12f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(0xFF475569.toInt())
            setPadding(0, 16, 0, 8)
        }
        root.addView(tvLogHeader)

        scrollViewLog = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                350
            )
            setBackgroundColor(0xFF0F172A.toInt())
            setPadding(16, 16, 16, 16)
        }
        tvLog = TextView(this).apply {
            text = "Ready.\n"
            textSize = 11f
            setTextColor(0xFFE2E8F0.toInt())
            typeface = android.graphics.Typeface.MONOSPACE
        }
        scrollViewLog.addView(tvLog)
        root.addView(scrollViewLog)

        return root
    }

    override fun onDestroy() {
        super.onDestroy()
        activityScope.cancel()
    }
}
