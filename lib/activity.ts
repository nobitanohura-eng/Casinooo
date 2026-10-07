import { adminDb } from './admin';

export async function logActivity({
  lead_id = null,
  action,
  description,
  actor = 'Workspace Owner',
  metadata = null,
}: {
  lead_id?: string | null;
  action: string;
  description: string;
  actor?: string;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const db = adminDb();
    await db.from('activity_logs').insert({
      lead_id,
      action,
      description,
      actor,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
