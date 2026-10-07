import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { sendEmailMessage, getEmailConfig } from '@/lib/email-sender';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const emailConfig = await getEmailConfig();

    const recipient = body.recipient || emailConfig.fromEmail || auth.user.email;

    if (!recipient) {
      return NextResponse.json(
        { error: 'Please provide a recipient email address to send the test email to.' },
        { status: 400 }
      );
    }

    if (!emailConfig.configured) {
      return NextResponse.json(
        {
          error:
            'No email credentials configured. Please set your Gmail & 16-digit Google App Password or Resend API key in Settings first.',
        },
        { status: 400 }
      );
    }

    const testSubject = '🚚 Test Verification: Papa Transport Outreach Gateway';
    const testText = `Hello! This is a test verification email from Papa Transport Leads.\n\nYour outgoing email service is configured and operational.\nProvider: ${emailConfig.provider}\nSent from: ${emailConfig.fromEmail}\nTimestamp: ${new Date().toLocaleString('en-IN')}`;
    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 20px;">Papa Transport Leads</h2>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0; color: #166534; font-weight: 600; font-size: 14px;">✓ Outgoing Email Delivery Confirmed!</p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
          Your outreach system successfully sent this message. You can now send approved outreach proposals to business leads.
        </p>
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #64748b;">
          <strong>Provider:</strong> ${emailConfig.provider}<br />
          <strong>From:</strong> ${emailConfig.fromEmail}<br />
          <strong>Time:</strong> ${new Date().toLocaleString('en-IN')}
        </div>
      </div>
    `;

    const result = await sendEmailMessage({
      to: recipient,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to send test email',
          provider: result.provider,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipient}!`,
      provider: result.provider,
      messageId: result.messageId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected error while sending test email' },
      { status: 500 }
    );
  }
}
