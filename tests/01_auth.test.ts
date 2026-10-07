import { describe, it, expect, beforeEach } from 'vitest';
import { requireUser } from '@/lib/auth';

describe('1. Authentication and Authorization', () => {
  beforeEach(() => {
    delete process.env.TEST_AUTH_REJECT;
    delete process.env.TEST_USER_EMAIL;
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com,driver@papatransport.com';
  });

  it('rejects unauthenticated requests with 401', async () => {
    process.env.TEST_AUTH_REJECT = 'true';
    const auth = await requireUser();
    expect(auth.error).not.toBeNull();
    const data = await auth.error!.json();
    expect(auth.error!.status).toBe(401);
    expect(data.error).toContain('Authentication required');
  });

  it('rejects authenticated users whose email is not on the allowlist with 403', async () => {
    process.env.TEST_USER_EMAIL = 'stranger@example.com';
    const auth = await requireUser();
    expect(auth.error).not.toBeNull();
    const data = await auth.error!.json();
    expect(auth.error!.status).toBe(403);
    expect(data.error).toContain('not on the authorized allowlist');
  });

  it('authorizes user when email matches the allowlist', async () => {
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
    const auth = await requireUser();
    expect(auth.error).toBeNull();
    expect(auth.user).toBeDefined();
    expect(auth.user?.email).toBe('owner@papatransport.com');
  });
});
