import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { runAiLeadScout } from '@/lib/ai-agent';
import { adminDb } from '@/lib/admin';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await runAiLeadScout({
      target_area: body.target_area,
      category: body.category,
      count: body.count ? Number(body.count) : 5,
      custom_prompt: body.custom_prompt,
      auto_draft: body.auto_draft !== false,
      auto_followup: body.auto_followup !== false,
      api_key: body.api_key,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to run AI Lead Scout' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const { data: aiLeads } = await db
      .from('leads')
      .select('id, company_name, city, created_at, estimated_value')
      .eq('source', '🤖 AI Lead Scout')
      .order('created_at', { ascending: false })
      .limit(10);

    const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    return NextResponse.json({
      status: 'ready',
      ai_provider: hasOpenAi ? 'OpenAI GPT-4o-mini' : hasGemini ? 'Google Gemini 1.5' : 'Built-in Delhi NCR Engine (Zero API Keys)',
      total_scouted_leads: (aiLeads || []).length,
      recent_leads: aiLeads || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to get AI Scout status' },
      { status: 500 }
    );
  }
}
