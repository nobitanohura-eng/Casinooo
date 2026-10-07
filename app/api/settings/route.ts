import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { getAppSettings, updateAppSetting, checkDailySendLimit } from '@/lib/settings';
import { settingsUpdateSchema } from '@/lib/validations';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';
import { getEmailConfig } from '@/lib/email-sender';

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

    const emailConfig = await getEmailConfig();

    return NextResponse.json({
      settings,
      limits,
      suppressions: suppressions || [],
      suppressionsCount: suppCount || 0,
      emailConfig,
      resend: {
        configured: emailConfig.provider === 'resend',
        fromEmail: emailConfig.fromEmail || 'Not configured',
      },
      sms: {
        enabled: true,
        reason: 'Android companion phone gateway is available in the SMS Gateway tab.',
        futureBoundary: 'Paired Android phone sends SMS using physical SIM card.',
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

    if (val.email_config !== undefined) {
      await updateAppSetting('smtp_config', val.email_config);
      await logActivity({
        action: 'settings_updated',
        description: `Email configuration updated (provider: ${val.email_config.provider || 'custom'})`,
        actor: auth.user.email || 'Owner',
      });
    }

    const updated = await getAppSettings();
    const updatedEmailConfig = await getEmailConfig();
    return NextResponse.json({ success: true, settings: updated, emailConfig: updatedEmailConfig });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
