import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { generatePairingCode } from '@/lib/sms';
import { adminDb } from '@/lib/admin';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const pin = generatePairingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store pending pairing record
    await db.from('app_settings').upsert({
      key: `sms_pairing_${pin}`,
      value: {
        pin,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const serverUrl = `${proto}://${host}`;

    return NextResponse.json({
      ok: true,
      pin,
      expires_at: expiresAt,
      server_url: serverUrl,
      qr_payload: JSON.stringify({
        server: serverUrl,
        pin,
        app: 'Papa Transport SMS Gateway',
      }),
      instructions: 'Open Papa Transport Companion App on your Android phone, enter this 6-digit PIN or scan QR code.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start pairing' }, { status: 500 });
  }
}
