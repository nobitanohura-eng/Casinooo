import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { queueSmsJob } from '@/lib/sms';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const { phone_number, confirm, custom_text } = body;

    if (confirm !== true) {
      return NextResponse.json(
        { error: 'Explicit confirmation required. Check the confirmation box before sending test SMS.' },
        { status: 400 }
      );
    }

    if (!phone_number || typeof phone_number !== 'string') {
      return NextResponse.json({ error: 'Please enter your mobile number for the test.' }, { status: 400 });
    }

    const cleanPhone = phone_number.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const testMessage =
      custom_text ||
      `[Test SMS] Papa Transport Gateway verified on your Android SIM! Server connection and SIM card dispatch are working normally. Timestamp: ${new Date().toLocaleTimeString('en-IN')}`;

    const db = adminDb();
    // Check if there is an online paired device
    const { data: devices } = await db.from('sms_devices').select('*').eq('status', 'online');
    if (!devices || devices.length === 0) {
      return NextResponse.json(
        {
          error: 'No online paired Android phone found. Please pair and keep the Papa Transport Android app open on your phone.',
        },
        { status: 422 }
      );
    }

    const result = await queueSmsJob({
      lead_id: 'test_lead',
      lead_company_name: 'Owner Self Test',
      recipient_phone: cleanPhone,
      message_text: testMessage,
      requires_manual_approval: false, // Explicitly confirmed by owner
      idempotency_key: `test_sms_${cleanPhone}_${Date.now()}`,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      job: result.job,
      message: `Test SMS queued successfully! Your paired phone (${devices[0].device_name}) will dispatch it via SIM shortly.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch test SMS' }, { status: 500 });
  }
}
