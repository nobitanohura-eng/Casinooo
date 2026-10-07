// Self-contained persistent database engine for Papa Transport Leads
// Supports PostgREST-compatible syntax with local JSON disk persistence for Render and local development,
// and zero-IO in-memory execution during automated test suites.

import fs from 'fs';
import path from 'path';

type Row = Record<string, any>;

export class MockTable {
  private rows: Row[] = [];
  private onMutate?: () => void;

  constructor(initialData: Row[] = [], onMutate?: () => void) {
    this.rows = [...initialData];
    this.onMutate = onMutate;
  }

  setMutateHandler(handler: () => void) {
    this.onMutate = handler;
  }

  notifyMutate() {
    if (this.onMutate) {
      this.onMutate();
    }
  }

  getRows() {
    return this.rows;
  }

  setRows(r: Row[]) {
    this.rows = r;
    this.notifyMutate();
  }

  clear() {
    this.rows = [];
    this.notifyMutate();
  }
}

const DEFAULT_SETTINGS = [
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
];

const SEED_LEADS = [
  {
    id: 'lead-delhi-001',
    company_name: 'Sharma Garments Export Pvt Ltd',
    contact_name: 'Rajesh Sharma',
    category: 'Garment manufacturers and exporters',
    email: 'rajesh@sharmagarments.example.com',
    normalized_email: 'rajesh@sharmagarments.example.com',
    phone: '+91 98112 34567',
    normalized_phone: '+919811234567',
    website: 'https://sharmagarments.example.com',
    address: 'Plot 42, Sector 63',
    city: 'Noida',
    source: 'Noida Industrial Directory',
    vehicle_requirement: 'Tata Ace Gold',
    route_area: 'Noida Sector 63 to Gandhinagar Delhi',
    frequency: 'Daily trips',
    status: 'order_confirmed',
    priority: 'high',
    notes: 'Booked 5 round trips for ready garment consignments. Tata Ace Gold dedicated.',
    estimated_value: 25000,
    actual_revenue: 14500,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-delhi-002',
    company_name: 'Apex Auto Spares & Precision Components',
    contact_name: 'Amit Verma',
    category: 'Auto components and machine shops',
    email: 'purchases@apexautospares.example.com',
    normalized_email: 'purchases@apexautospares.example.com',
    phone: '+91 98991 22334',
    normalized_phone: '+919899122334',
    address: 'C-18, Phase 2, Okhla Industrial Area',
    city: 'Delhi',
    source: 'Okhla Manufacturers Association',
    vehicle_requirement: 'Tata Ace Gold',
    route_area: 'Okhla Phase 2 to Mayapuri Industrial Area',
    frequency: '3 times a week',
    status: 'interested',
    priority: 'high',
    notes: 'Interested in regular small-batch spare part dispatch. Requested per-trip rates.',
    estimated_value: 18000,
    actual_revenue: 0,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-delhi-003',
    company_name: 'Deluxe Corrugated Boxes LLP',
    contact_name: 'Manoj Gupta',
    category: 'Packaging and corrugated box suppliers',
    email: 'manoj.gupta@deluxepack.example.com',
    normalized_email: 'manoj.gupta@deluxepack.example.com',
    phone: '+91 97170 88990',
    normalized_phone: '+919717088990',
    address: 'Ecotech III, Kasna',
    city: 'Greater Noida',
    source: 'Greater Noida Industrial Directory',
    vehicle_requirement: 'Tata Ace Gold (Chota Hathi)',
    route_area: 'Kasna Greater Noida to Patparganj',
    frequency: 'Alternate days',
    status: 'contacted',
    priority: 'medium',
    notes: 'First introductory pitch sent. Need follow-up call.',
    estimated_value: 12000,
    actual_revenue: 0,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-delhi-004',
    company_name: 'NCR Pharma & Surgical Supplies',
    contact_name: 'Dr. Vivek Batra',
    category: 'Pharmaceutical and surgical distributors',
    email: 'logistics@ncrpharma.example.com',
    normalized_email: 'logistics@ncrpharma.example.com',
    phone: '+91 98101 44556',
    normalized_phone: '+919810144556',
    address: 'Patparganj Industrial Area',
    city: 'Delhi',
    source: 'Trade India',
    vehicle_requirement: 'Tata Ace Gold (Covered)',
    route_area: 'Patparganj to Noida Hospital Sector',
    frequency: 'Twice a week',
    status: 'quotation_requested',
    priority: 'high',
    notes: 'Needs covered vehicle for medicines. Quotation of Rs 1,800/trip requested.',
    estimated_value: 22000,
    actual_revenue: 0,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-delhi-005',
    company_name: 'Krishna Hardware & Tooling',
    contact_name: 'Suresh Agarwal',
    category: 'Hardware and sanitaryware wholesalers',
    email: 'krishna.tools@gmail.example.com',
    normalized_email: 'krishna.tools@gmail.example.com',
    phone: '+91 99113 77889',
    normalized_phone: '+919911377889',
    address: 'Sector 10, Noida Industrial Area',
    city: 'Noida',
    source: 'Local shop visits',
    vehicle_requirement: 'Tata Ace Gold',
    route_area: 'Sector 10 to Chawri Bazar Delhi',
    frequency: 'On-demand',
    status: 'new',
    priority: 'medium',
    notes: 'Heavy hardware consignments. Need morning pickup.',
    estimated_value: 9000,
    actual_revenue: 0,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-delhi-006',
    company_name: 'Aggarwal Sweets & Catering Bulk Logistics',
    contact_name: 'Praveen Aggarwal',
    category: 'FMCG and packaged food distributors',
    email: 'orders@aggarwalsweets.example.com',
    normalized_email: 'orders@aggarwalsweets.example.com',
    phone: '+91 98188 55667',
    normalized_phone: '+919818855667',
    address: 'Fatehpuri / Chandni Chowk',
    city: 'Delhi',
    source: 'Existing customer reference',
    vehicle_requirement: 'Tata Ace Gold',
    route_area: 'Old Delhi to Noida Sector 18 & Greater Noida',
    frequency: 'Daily early morning',
    status: 'customer',
    priority: 'high',
    notes: 'Long-term customer. Very reliable daily morning run.',
    estimated_value: 50000,
    actual_revenue: 38000,
    email_consent_status: 'b2b_public_directory',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_FOLLOWUPS = [
  {
    id: 'fu-delhi-001',
    lead_id: 'lead-delhi-002',
    scheduled_for: new Date(Date.now() + 2 * 3600000).toISOString(),
    note: 'Call Amit ji regarding per-trip rate from Okhla to Mayapuri.',
    status: 'pending',
    type: 'phone_call',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fu-delhi-002',
    lead_id: 'lead-delhi-004',
    scheduled_for: new Date(Date.now() + 26 * 3600000).toISOString(),
    note: 'Send formal quote of Rs 1,800/trip for covered Tata Ace to Dr. Batra.',
    status: 'pending',
    type: 'phone_call',
    created_at: new Date().toISOString(),
  },
];

const SEED_ACTIVITIES = [
  {
    id: 'act-delhi-001',
    lead_id: 'lead-delhi-001',
    action: 'order_confirmed',
    details: { note: 'Confirmed 5 round trips from Noida Sector 63 to Gandhinagar' },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-delhi-002',
    lead_id: 'lead-delhi-006',
    action: 'payment_received',
    details: { amount: 38000, note: 'Monthly settlement received from Aggarwal Sweets' },
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export class MockSupabaseClient {
  private tables: Record<string, MockTable> = {};
  private persistenceFile?: string;
  private isPersisting = false;

  constructor(persistenceFile?: string) {
    this.persistenceFile = persistenceFile;
    this.initTables();
  }

  private initTables() {
    this.tables = {
      leads: new MockTable([], () => this.schedulePersist()),
      suppressions: new MockTable([], () => this.schedulePersist()),
      email_drafts: new MockTable([], () => this.schedulePersist()),
      send_attempts: new MockTable([], () => this.schedulePersist()),
      email_events: new MockTable([], () => this.schedulePersist()),
      follow_ups: new MockTable([], () => this.schedulePersist()),
      activity_logs: new MockTable([], () => this.schedulePersist()),
      app_settings: new MockTable(DEFAULT_SETTINGS, () => this.schedulePersist()),
    };

    if (this.persistenceFile && process.env.NODE_ENV !== 'test') {
      this.loadFromDisk();
    }
  }

  private loadFromDisk() {
    if (!this.persistenceFile) return;
    try {
      if (fs.existsSync(this.persistenceFile)) {
        const raw = fs.readFileSync(this.persistenceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [name, rows] of Object.entries(parsed)) {
          if (Array.isArray(rows) && this.tables[name]) {
            this.tables[name].setRows(rows);
          }
        }
      } else {
        // Initialize default seed data
        this.tables.leads.setRows(SEED_LEADS);
        this.tables.follow_ups.setRows(SEED_FOLLOWUPS);
        this.tables.activity_logs.setRows(SEED_ACTIVITIES);
        this.tables.app_settings.setRows(DEFAULT_SETTINGS);
        this.saveToDisk();
      }
    } catch {
      // Fallback gracefully to memory if filesystem is restricted
    }
  }

  private schedulePersist() {
    if (!this.persistenceFile || process.env.NODE_ENV === 'test' || this.isPersisting) {
      return;
    }
    this.saveToDisk();
  }

  private saveToDisk() {
    if (!this.persistenceFile || process.env.NODE_ENV === 'test') return;
    try {
      this.isPersisting = true;
      const dir = path.dirname(this.persistenceFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const snapshot: Record<string, Row[]> = {};
      for (const [name, table] of Object.entries(this.tables)) {
        snapshot[name] = table.getRows();
      }

      fs.writeFileSync(this.persistenceFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    } catch {
      // Ignore write errors gracefully
    } finally {
      this.isPersisting = false;
    }
  }

  reset() {
    Object.values(this.tables).forEach((t) => t.clear());
    this.tables.app_settings.setRows(DEFAULT_SETTINGS);
  }

  from(tableName: string) {
    if (!this.tables[tableName]) {
      this.tables[tableName] = new MockTable([], () => this.schedulePersist());
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
          id: item.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
            id: item.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
      this.table.setRows(rows);
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

// Global in-memory instance for testing
export const globalMockDb = new MockSupabaseClient();

// Production persistent instance for Render / local dev
const DB_FILE = process.env.DB_FILE_PATH || path.join(process.cwd(), 'data', 'leads.json');
let persistentInstance: MockSupabaseClient | null = null;

export function getDatabase(): MockSupabaseClient {
  if (process.env.NODE_ENV === 'test') {
    return globalMockDb;
  }
  if (!persistentInstance) {
    persistentInstance = new MockSupabaseClient(DB_FILE);
  }
  return persistentInstance;
}
