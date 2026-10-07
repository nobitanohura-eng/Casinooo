import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  getPhoneGatewayConfig,
  savePhoneGatewayConfig,
  checkPhoneGatewayHealth,
  sendSmsViaPhoneGateway,
} from '@/lib/android-sms-gateway';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const config = await getPhoneGatewayConfig();
    const health = await checkPhoneGatewayHealth(config);

    return NextResponse.json({
      config: {
        ...config,
        password: config.password ? '••••••••' : '',
      },
      rawConfig: {
        baseUrl: config.baseUrl,
        username: config.username,
        simNumber: config.simNumber,
      },
      health,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to check phone gateway status' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const updated = await savePhoneGatewayConfig(body);
    const health = await checkPhoneGatewayHealth(updated);

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        password: updated.password ? '••••••••' : '',
      },
      health,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update phone gateway configuration' },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { phoneNumber, message, simNumber, confirm } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Both phoneNumber and message are required' },
        { status: 400 }
      );
    }

    if (confirm !== true) {
      return NextResponse.json(
        { error: 'Explicit user confirmation is required before sending SMS.' },
        { status: 400 }
      );
    }

    const result = await sendSmsViaPhoneGateway({
      phoneNumber,
      message,
      simNumber: simNumber ? Number(simNumber) : undefined,
      senderActor: auth.user.email || 'Owner',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `SMS dispatched successfully through your Android Phone (ID: ${result.messageId})`,
      messageId: result.messageId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to send message via phone gateway' },
      { status: 500 }
    );
  }
}
