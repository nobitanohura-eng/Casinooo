import { describe, it, expect, beforeEach } from 'vitest';
import { POST as startPairing } from '@/app/api/sms/pair/start/route';
import { POST as completePairing } from '@/app/api/sms/pair/complete/route';
import { GET as pollJobs } from '@/app/api/sms/device/poll/route';
import { POST as heartbeat } from '@/app/api/sms/device/heartbeat/route';
import { POST as reportJob } from '@/app/api/sms/device/report/route';
import { POST as createSmsJob } from '@/app/api/sms/jobs/route';
import { POST as testSms } from '@/app/api/sms/test/route';
import { POST as revokeDevice } from '@/app/api/sms/devices/[id]/revoke/route';
import { GET as getPhoneGateway, PATCH as patchPhoneGateway, POST as postPhoneGateway } from '@/app/api/sms/phone-gateway/route';
import { updateSmsSettings } from '@/lib/sms';
import { globalMockDb } from '@/lib/mock-db';

describe('15. Android Phone + SIM SMS Gateway', () => {
  beforeEach(async () => {
    globalMockDb.reset();
    delete process.env.TEST_AUTH_REJECT;
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
    await updateSmsSettings({ enabled: true, daily_limit: 50 });
  });

  it('completes secure 6-digit device pairing and returns Bearer token', async () => {
    // 1. Start pairing on web dashboard
    const startRes = await startPairing(new Request('http://localhost:3000/api/sms/pair/start', { method: 'POST' }));
    const { pin, server_url } = await startRes.json();
    expect(pin).toMatch(/^\d{6}$/);
    expect(server_url).toBeDefined();

    // 2. Android app sends PIN
    const completeRes = await completePairing(
      new Request('http://localhost:3000/api/sms/pair/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pin,
          device_name: 'Redmi Note 12',
          device_model: '22111317I',
          phone_number: '+91 98110 00000',
          sim_carrier: 'Jio 4G',
          sim_count: 2,
        }),
      })
    );

    const compData = await completeRes.json();
    expect(compData.ok).toBe(true);
    expect(compData.token).toMatch(/^sms_dev_tok_/);
    expect(compData.device_id).toBeDefined();
  });

  it('authenticates device with Bearer token and polls queued jobs with idempotency', async () => {
    // 1. Pair device
    const startRes = await startPairing(new Request('http://localhost:3000/api/sms/pair/start', { method: 'POST' }));
    const { pin } = await startRes.json();
    const compRes = await completePairing(
      new Request('http://localhost:3000/api/sms/pair/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin, device_name: 'Samsung Galaxy M31' }),
      })
    );
    const { token } = await compRes.json();

    // 2. Queue an SMS job
    const queueRes = await createSmsJob(
      new Request('http://localhost:3000/api/sms/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: 'lead_123',
          lead_company_name: 'Shree Balaji Garments',
          recipient_phone: '+91 98112 34567',
          message_text: 'Tata Ace Gold transport available in Noida.',
          requires_manual_approval: false,
        }),
      })
    );
    const { job } = await queueRes.json();
    expect(job.status).toBe('queued');

    // 3. Android companion polls for pending jobs
    const pollRes = await pollJobs(
      new Request('http://localhost:3000/api/sms/device/poll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const pollData = await pollRes.json();
    expect(pollData.ok).toBe(true);
    expect(pollData.jobs_count).toBe(1);
    expect(pollData.jobs[0].id).toBe(job.id);
    expect(pollData.jobs[0].status).toBe('claimed');

    // 4. Android companion reports job outcome
    const reportRes = await reportJob(
      new Request('http://localhost:3000/api/sms/device/report', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          status: 'sent',
          carrier_reference: 'JIO_REF_9981',
        }),
      })
    );
    const reportData = await reportRes.json();
    expect(reportData.ok).toBe(true);
    expect(reportData.status).toBe('sent');
  });

  it('enforces explicit confirmation for test SMS and rejects without authorization', async () => {
    // Attempt sending test SMS without confirm flag
    const rejectRes = await testSms(
      new Request('http://localhost:3000/api/sms/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+91 98110 00000',
          confirm: false,
        }),
      })
    );
    expect(rejectRes.status).toBe(400);
    const rejectData = await rejectRes.json();
    expect(rejectData.error).toContain('Explicit confirmation required');
  });

  it('revokes a paired device and rejects subsequent unauthorized requests', async () => {
    // 1. Pair device
    const startRes = await startPairing(new Request('http://localhost:3000/api/sms/pair/start', { method: 'POST' }));
    const { pin } = await startRes.json();
    const compRes = await completePairing(
      new Request('http://localhost:3000/api/sms/pair/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin, device_name: 'Test Phone' }),
      })
    );
    const { token, device_id } = await compRes.json();

    // 2. Revoke device
    const revokeRes = await revokeDevice(
      new Request(`http://localhost:3000/api/sms/devices/${device_id}/revoke`, { method: 'POST' }),
      { params: Promise.resolve({ id: device_id }) }
    );
    expect(revokeRes.status).toBe(200);

    // 3. Polling now fails with 401
    const pollRes = await pollJobs(
      new Request('http://localhost:3000/api/sms/device/poll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(pollRes.status).toBe(401);
  });

  it('handles direct Android Phone SMS Gateway config, health, and confirmation check', async () => {
    // 1. GET phone gateway status
    const getRes = await getPhoneGateway();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.config).toBeDefined();
    expect(getData.health).toBeDefined();

    // 2. PATCH phone gateway config (update SIM slot)
    const patchRes = await patchPhoneGateway(
      new Request('http://localhost:3000/api/sms/phone-gateway', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ simNumber: 2 }),
      })
    );
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.config.simNumber).toBe(2);

    // 3. POST direct SMS rejects without explicit confirmation
    const rejectRes = await postPhoneGateway(
      new Request('http://localhost:3000/api/sms/phone-gateway', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+91 98110 00000',
          message: 'Test message',
          confirm: false,
        }),
      })
    );
    expect(rejectRes.status).toBe(400);
    const rejectData = await rejectRes.json();
    expect(rejectData.error).toContain('Explicit user confirmation is required');
  });
});
