import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const db = adminDb();

    const { data: device } = await db.from('sms_devices').select('*').eq('id', id).maybeSingle();
    if (!device) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
    }

    await db.from('sms_devices').update({ status: 'revoked' }).eq('id', id);

    await logActivity({
      lead_id: null,
      action: 'device_revoked',
      description: `Revoked SMS Gateway device: ${device.device_name} (${device.phone_number || 'No number'})`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({
      ok: true,
      message: `Device ${device.device_name} has been revoked and disconnected from the SMS Gateway.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to revoke device' }, { status: 500 });
  }
}
