// Lightweight in-memory Supabase PostgREST mock for tests and offline development
type Row = Record<string, any>;

class MockTable {
  private rows: Row[] = [];

  constructor(initialData: Row[] = []) {
    this.rows = [...initialData];
  }

  getRows() {
    return this.rows;
  }

  setRows(r: Row[]) {
    this.rows = r;
  }

  clear() {
    this.rows = [];
  }
}

export class MockSupabaseClient {
  private tables: Record<string, MockTable> = {
    leads: new MockTable(),
    suppressions: new MockTable(),
    email_drafts: new MockTable(),
    send_attempts: new MockTable(),
    email_events: new MockTable(),
    follow_ups: new MockTable(),
    activity_logs: new MockTable(),
    app_settings: new MockTable([
      { key: 'global_email_paused', value: true },
      { key: 'daily_send_limit', value: 25 },
      {
        key: 'company_profile',
        value: {
          name: 'Papa Transport Services',
          phone: '+91 98110 00000',
          base_city: 'Noida',
          service_area: 'Noida–Delhi NCR',
          vehicle_type: 'Tata Ace Gold (Chota Hathi)',
        },
      },
    ]),
  };

  reset() {
    Object.values(this.tables).forEach((t) => t.clear());
    this.tables.app_settings.setRows([
      { key: 'global_email_paused', value: true },
      { key: 'daily_send_limit', value: 25 },
      {
        key: 'company_profile',
        value: {
          name: 'Papa Transport Services',
          phone: '+91 98110 00000',
          base_city: 'Noida',
          service_area: 'Noida–Delhi NCR',
          vehicle_type: 'Tata Ace Gold (Chota Hathi)',
        },
      },
    ]);
  }

  from(tableName: string) {
    if (!this.tables[tableName]) {
      this.tables[tableName] = new MockTable();
    }
    const table = this.tables[tableName];

    return new QueryBuilder(table, this);
  }
}

class QueryBuilder {
  private table: MockTable;
  private client: MockSupabaseClient;
  private filters: ((row: Row) => boolean)[] = [];
  private orderCol?: string;
  private ascending = true;
  private limitCount?: number;
  private offsetCount = 0;
  private isInsert = false;
  private isUpdate = false;
  private isDelete = false;
  private isUpsert = false;
  private upsertConflictCol?: string;
  private mutateData?: any;

  constructor(table: MockTable, client: MockSupabaseClient) {
    this.table = table;
    this.client = client;
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push((r) => r[col] !== val);
    return this;
  }

  or(conditions: string) {
    // Basic ilike or search parser: `col1.ilike.%val%,col2.ilike.%val%`
    const parts = conditions.split(',');
    this.filters.push((row) => {
      return parts.some((p) => {
        if (p.includes('.ilike.')) {
          const [col, searchWithPercent] = p.split('.ilike.');
          const query = searchWithPercent.replace(/%/g, '').toLowerCase();
          return String(row[col] || '')
            .toLowerCase()
            .includes(query);
        }
        if (p === 'opted_out.eq.true') return row.opted_out === true;
        if (p === 'status.eq.do_not_contact') return row.status === 'do_not_contact';
        return false;
      });
    });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push((r) => r[col] >= val);
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push((r) => r[col] <= val);
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push((r) => vals.includes(r[col]));
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.ascending = options?.ascending !== false;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  insert(data: Row | Row[]) {
    this.isInsert = true;
    this.mutateData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: Row) {
    this.isUpdate = true;
    this.mutateData = data;
    return this;
  }

  upsert(data: Row | Row[], options?: { onConflict?: string }) {
    this.isUpsert = true;
    this.mutateData = Array.isArray(data) ? data : [data];
    this.upsertConflictCol = options?.onConflict || 'id';
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  private execute() {
    let rows = this.table.getRows();

    if (this.isInsert) {
      const created: Row[] = [];
      for (const item of this.mutateData) {
        const row = {
          id: item.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          optout_token: item.optout_token || `token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          ...item,
        };
        rows.push(row);
        created.push(row);
      }
      this.table.setRows(rows);
      return { data: created, error: null, count: created.length };
    }

    if (this.isUpsert) {
      const conflictCol = this.upsertConflictCol || 'id';
      const upserted: Row[] = [];
      for (const item of this.mutateData) {
        const idx = rows.findIndex((r) => r[conflictCol] === item[conflictCol]);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
          upserted.push(rows[idx]);
        } else {
          const row = {
            id: item.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          };
          rows.push(row);
          upserted.push(row);
        }
      }
      this.table.setRows(rows);
      return { data: upserted, error: null, count: upserted.length };
    }

    if (this.isUpdate) {
      const matching = rows.filter((r) => this.filters.every((f) => f(r)));
      matching.forEach((r) => {
        Object.assign(r, this.mutateData);
      });
      return { data: matching, error: null, count: matching.length };
    }

    if (this.isDelete) {
      const remaining = rows.filter((r) => !this.filters.every((f) => f(r)));
      this.table.setRows(remaining);
      return { data: null, error: null };
    }

    // Select query
    let filtered = rows.filter((r) => this.filters.every((f) => f(r)));
    const totalCount = filtered.length;

    if (this.orderCol) {
      const col = this.orderCol;
      filtered.sort((a, b) => {
        const valA = a[col] || '';
        const valB = b[col] || '';
        if (valA < valB) return this.ascending ? -1 : 1;
        if (valA > valB) return this.ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.offsetCount || this.limitCount) {
      const start = this.offsetCount || 0;
      const end = this.limitCount ? start + this.limitCount : undefined;
      filtered = filtered.slice(start, end);
    }

    return { data: filtered, error: null, count: totalCount };
  }

  async single() {
    const res = this.execute();
    const rows = Array.isArray(res.data) ? res.data : [];
    if (rows.length === 0) {
      return { data: null, error: new Error('Row not found') };
    }
    return { data: rows[0], error: null };
  }

  async maybeSingle() {
    const res = this.execute();
    const rows = Array.isArray(res.data) ? res.data : [];
    return { data: rows[0] || null, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const res = this.execute();
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }
}

export const globalMockDb = new MockSupabaseClient();
