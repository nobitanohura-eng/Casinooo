import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { getAppSettings, updateAppSetting, checkDailySendLimit } from '@/lib/settings';
import { settingsUpdateSchema } from '@/lib/validations';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const settings = await getAppSettings();
    const limits = await checkDailySendLimit();

    const { data: suppressions, count: suppCount } = await db
      .from('suppressions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      settings,
      limits,
      suppressions: suppressions || [],
      suppressionsCount: suppCount || 0,
      resend: {
        configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        fromEmail: process.env.RESEND_FROM_EMAIL || 'Not configured in environment',
      },
      sms: {
        enabled: false,
        reason:
          'SMS integration is disabled. Indian commercial SMS requires TRAI/DLT registration, approved sender headers, and verified scrubbed consent templates.',
        futureBoundary:
          'Future integration should hook into a compliant DLT provider (e.g. Jio / Airtel / SMSHorizon) or an authorized local Android phone gateway app.',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    // Check if adding manual suppression
    if (body.suppressEmail) {
      await suppressEmail(body.suppressEmail, 'manual_request', 'settings_screen');
      await logActivity({
        action: 'manual_suppression',
        description: `Manually added ${body.suppressEmail} to central suppression list`,
        actor: auth.user.email || 'Owner',
      });
      return NextResponse.json({ success: true, message: `Suppressed ${body.suppressEmail}` });
    }

    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid settings' }, { status: 400 });
    }

    const val = parsed.data;

    if (val.global_email_paused !== undefined) {
      await updateAppSetting('global_email_paused', val.global_email_paused);
      await logActivity({
        action: 'settings_updated',
        description: `Global email pause set to: ${val.global_email_paused ? 'PAUSED' : 'ACTIVE'}`,
        actor: auth.user.email || 'Owner',
      });
    }

    if (val.daily_send_limit !== undefined) {
      await updateAppSetting('daily_send_limit', val.daily_send_limit);
      await logActivity({
        action: 'settings_updated',
        description: `Daily sending limit updated to ${val.daily_send_limit}`,
        actor: auth.user.email || 'Owner',
      });
    }

    if (val.company_profile !== undefined) {
      await updateAppSetting('company_profile', val.company_profile);
    }

    const updated = await getAppSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
