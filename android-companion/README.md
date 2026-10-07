# Papa Transport Android SMS Gateway Companion App

This is the native Android companion application for **Papa Transport Leads**.
It turns an Android phone with a physical SIM card into an automated, secure outbound SMS gateway for business leads.

---

## 🏗️ Architecture & Security Model

```
Papa Transport Web App / CRM
             │
             ▼
Secure Backend API (/api/sms/jobs)
             │
             ▼
Database SMS Queue (data/leads.json)
             │
             ▼ (Secure Bearer Auth)
Paired Android Phone Companion App
             │
             ▼ (Android SmsManager API)
Physical SIM 1 / SIM 2 (Jio / Airtel / Vi)
             │
             ▼
Recipient Customer Mobile (+91...)
```

- **Zero Direct Access**: The web dashboard never accesses your SIM card directly.
- **Revocable Device Pairing**: Uses a 6-digit one-time PIN (expires in 10 mins). When paired, the app receives a secure revocable Bearer token.
- **Idempotency & Duplicate Guards**: Retries and reconnects cannot send double SMS messages.
- **Telecom & DLT Compliance**: Configurable daily limit (default 50 SMS/day) to keep personal SIM safely under telecom spam limits.
- **Dual-SIM Support**: Choose whether to dispatch via SIM 1 or SIM 2 dynamically.

---

## 📲 How to Build & Install on Your Android Phone

### Option A: Open in Android Studio
1. Open **Android Studio**.
2. Select **Open** and choose the `android-companion` folder.
3. Connect your Android phone via USB (with Developer Options & USB Debugging enabled).
4. Click **Run 'app'** (Green play button) or build APK: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
5. Install the APK on your phone.

### Option B: Command Line (Gradle)
```bash
cd android-companion
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚙️ Initial Phone Setup & Permissions

1. **Grant Permissions**:
   - When launching the app, allow **Send and view SMS messages** and **Phone Calls/State** (needed to detect SIM card).
2. **Disable Battery Optimization**:
   - The app will prompt to exclude itself from Android Battery Optimization so the background service does not get killed when the phone is locked.
3. **Pair with Dashboard**:
   - On the Papa Transport Leads web dashboard, go to the **📱 SMS Gateway** tab and click **"🔗 Pair Android Phone"**.
   - Note the **6-digit PIN** and Server URL.
   - Enter them in the Android app and tap **"🔗 Pair This Android Phone"**.
4. **Choose Active SIM**:
   - If using a Dual-SIM phone, select whether to dispatch from SIM 1 or SIM 2.

The app will now run a persistent background service with a status notification and automatically process approved SMS jobs!
