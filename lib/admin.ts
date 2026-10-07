import { getDatabase, globalMockDb } from './mock-db';

export function adminDb(): any {
  if (process.env.NODE_ENV === 'test') {
    return globalMockDb;
  }
  return getDatabase();
}
