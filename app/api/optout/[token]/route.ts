import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const db = adminDb();

    // Find lead by non-guessable cryptographic token
    const { data: lead, error } = await db
      .from('leads')
      .select('id, company_name, email, opted_out')
      .eq('optout_token', token)
      .maybeSingle();

    if (error) {
      console.error('Error finding lead by optout_token:', error);
    }

    if (lead && lead.email) {
      // 1. Add to central suppression list
      await suppressEmail(lead.email, 'unsubscribe', 'public_link');

      // 2. Mark lead opted out
      await db
        .from('leads')
        .update({
          opted_out: true,
          status: 'do_not_contact',
          next_follow_up_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      await logActivity({
        lead_id: lead.id,
        action: 'lead_unsubscribed',
        description: `Recipient ${lead.email} (${lead.company_name}) unsubscribed via public link`,
        actor: 'Recipient (Public Opt-out)',
      });
    }

    // Return friendly, clean HTML confirmation
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribed — NCR Transport Logistics</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fb; color: #172033; margin: 0; padding: 24px; display: grid; place-items: center; min-height: 80vh; }
    .card { background: #fff; border: 1px solid #e7ebf2; border-radius: 16px; max-width: 520px; width: 100%; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); text-align: center; }
    .icon { width: 56px; height: 56px; border-radius: 50%; background: #eaf8f1; color: #14764f; display: grid; place-items: center; margin: 0 auto 16px; font-size: 26px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 10px; }
    p { font-size: 14px; color: #748096; line-height: 1.6; margin: 0 0 20px; }
    .badge { display: inline-block; background: #edf1ff; color: #3659e3; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .footer { font-size: 11px; color: #a1a9b7; margin-top: 24px; border-top: 1px solid #f0f2f6; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>You have been unsubscribed</h1>
    <p>Your email address has been permanently added to our suppression list. You will not receive any further transport outreach from <strong>NCR Transport Logistics</strong>.</p>
    <div class="badge">Suppression active</div>
    <div class="footer">NCR Transport Logistics · Noida NCR · B2B Local Commercial Goods Movement</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    return new NextResponse(
      'Unable to process unsubscribe request. Please reply "unsubscribe" directly to the email.',
      { status: 500 }
    );
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  // Idempotent POST variant
  return GET(req, ctx);
}
