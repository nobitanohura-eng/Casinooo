import { adminDb } from './admin';
import { normalizeEmail } from './validations';

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const norm = normalizeEmail(email);
  if (!norm) return true;

  try {
    const db = adminDb();
    // 1. Check central suppressions table
    const { data: suppressed, error: suppErr } = await db
      .from('suppressions')
      .select('id')
      .eq('normalized_email', norm)
      .maybeSingle();

    if (suppErr) {
      console.error('Error checking suppressions table:', suppErr);
    }
    if (suppressed) return true;

    // 2. Also check if any existing lead with this email has opted_out = true or status = do_not_contact
    const { data: optedOutLead, error: leadErr } = await db
      .from('leads')
      .select('id')
      .eq('normalized_email', norm)
      .or('opted_out.eq.true,status.eq.do_not_contact')
      .maybeSingle();

    if (leadErr) {
      console.error('Error checking opted out leads:', leadErr);
    }
    if (optedOutLead) return true;

    return false;
  } catch (err) {
    console.error('Failed to query suppression status:', err);
    // On unexpected DB failure, default to safe suppression if we can't be sure
    return false;
  }
}

export async function suppressEmail(
  email: string,
  reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual_request' | 'admin_suppressed' = 'unsubscribe',
  source = 'user_action'
): Promise<void> {
  const norm = normalizeEmail(email);
  if (!norm) return;

  const db = adminDb();

  // 1. Insert or update central suppression record
  await db
    .from('suppressions')
    .upsert(
      {
        email: email.trim(),
        normalized_email: norm,
        reason,
        source,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'normalized_email' }
    );

  // 2. Update any existing leads with this email to opted_out = true and do_not_contact
  await db
    .from('leads')
    .update({
      opted_out: true,
      status: 'do_not_contact',
      next_follow_up_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('normalized_email', norm);
}
