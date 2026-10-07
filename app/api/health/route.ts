import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Papa Transport Leads',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
