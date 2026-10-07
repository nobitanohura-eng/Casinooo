// Node.js Android Phone SIM Simulator for Papa Transport Leads
// Simulates an Android companion device pairing, polling, and dispatching SMS jobs.

import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PIN = process.argv[2];

if (!PIN) {
  console.log(`
Usage:
  node scripts/simulate-android-device.mjs <6-DIGIT-PIN>

Example:
  node scripts/simulate-android-device.mjs 482910
  `);
  process.exit(1);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

async function main() {
  console.log(`📱 [Android Simulator] Pairing with server ${BASE_URL} using PIN ${PIN}...`);

  // Step 1: Pair
  const pairRes = await request('/api/sms/pair/complete', {
    method: 'POST',
    body: JSON.stringify({
      pin: PIN,
      device_name: 'Samsung Galaxy M31 (Simulated)',
      device_model: 'SM-M315F',
      phone_number: '+91 98110 00000',
      sim_carrier: 'Jio 4G (SIM 1)',
      sim_count: 2,
      app_version: '1.0.0-sim',
    }),
  });

  if (!pairRes.ok) {
    console.error(`❌ Pairing failed:`, pairRes.error || pairRes);
    process.exit(1);
  }

  const token = pairRes.token;
  const deviceId = pairRes.device_id;
  console.log(`✅ Device paired successfully! Device ID: ${deviceId}`);
  console.log(`🔑 Device Token: ${token.substring(0, 16)}...`);
  console.log(`📡 Starting background polling loop (every 5 seconds). Press Ctrl+C to stop.`);

  let pollCount = 0;
  setInterval(async () => {
    pollCount++;
    try {
      // 1. Send heartbeat
      await request('/api/sms/device/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          battery_level: 88,
          is_charging: true,
          selected_sim_slot: 0,
          sim_carrier: 'Jio 4G',
          sim_count: 2,
        }),
      });

      // 2. Poll jobs
      const pollRes = await request('/api/sms/device/poll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (pollRes.jobs && pollRes.jobs.length > 0) {
        console.log(`📥 Received ${pollRes.jobs.length} SMS jobs!`);
        for (const job of pollRes.jobs) {
          console.log(`📨 [SIM 1 Sending] To: ${job.recipient_phone} (${job.lead_company_name})`);
          console.log(`   Message: "${job.message_text}"`);

          // Simulate cellular dispatch delay
          await new Promise((r) => setTimeout(r, 2000));

          // Report outcome: sent
          await request('/api/sms/device/report', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              job_id: job.id,
              status: 'sent',
              carrier_reference: `JIO_SMS_${Date.now()}`,
            }),
          });
          console.log(`✅ [SIM Delivered] Job ${job.id} marked as SENT!`);
        }
      } else {
        if (pollCount % 6 === 0) {
          console.log(`⏳ Heartbeat OK. Waiting for pending SMS jobs...`);
        }
      }
    } catch (e) {
      console.error(`Polling error:`, e.message);
    }
  }, 5000);
}

main().catch(console.error);
