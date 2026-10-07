export type LeadCategory =
  | 'Garment manufacturers and exporters'
  | 'Warehouses and fulfilment centres'
  | 'Packaging suppliers'
  | 'Wholesalers'
  | 'Local transport companies'
  | 'Other relevant businesses';

export const LEAD_CATEGORIES: LeadCategory[] = [
  'Garment manufacturers and exporters',
  'Warehouses and fulfilment centres',
  'Packaging suppliers',
  'Wholesalers',
  'Local transport companies',
  'Other relevant businesses',
];

export type LeadStatus =
  | 'new'
  | 'researching'
  | 'ready_for_review'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'quotation_requested'
  | 'order_confirmed'
  | 'not_interested'
  | 'do_not_contact'
  // Legacy / convenience mappings:
  | 'customer'
  | 'drafted'
  | 'approved';

export const LEAD_STATUSES: { value: LeadStatus; label: string; hindiLabel: string; color: string }[] = [
  { value: 'new', label: 'New', hindiLabel: 'Naya lead', color: 'blue' },
  { value: 'researching', label: 'Researching', hindiLabel: 'Janch padtal', color: 'indigo' },
  { value: 'ready_for_review', label: 'Ready for Review', hindiLabel: 'Review ke liye taiyar', color: 'purple' },
  { value: 'contacted', label: 'Contacted', hindiLabel: 'Sampark kiya', color: 'amber' },
  { value: 'replied', label: 'Replied', hindiLabel: 'Jawab aaya', color: 'teal' },
  { value: 'interested', label: 'Interested', hindiLabel: 'Ruchikar / Deal baat', color: 'green' },
  { value: 'quotation_requested', label: 'Quotation Requested', hindiLabel: 'Rate mangwaya', color: 'emerald' },
  { value: 'order_confirmed', label: 'Order Confirmed', hindiLabel: 'Order confirm / Gaddi book', color: 'emerald' },
  { value: 'not_interested', label: 'Not Interested', hindiLabel: 'Zaroorat nahi', color: 'gray' },
  { value: 'do_not_contact', label: 'Do Not Contact', hindiLabel: 'Mana kiya (Suppressed)', color: 'red' },
];

export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  category: string;
  email: string | null;
  normalized_email: string | null;
  phone: string | null;
  normalized_phone: string | null;
  website: string | null;
  address: string | null;
  city: string;
  source: string;
  source_url: string | null;
  source_notes: string | null;
  vehicle_requirement: string;
  route_area: string;
  frequency: string;
  status: LeadStatus;
  priority: LeadPriority;
  notes: string | null;
  estimated_value: number;
  actual_revenue: number;
  email_consent_status: string;
  opted_out: boolean;
  optout_token: string;
  email_subject: string | null;
  email_body: string | null;
  approved_at: string | null;
  sent_at: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailDraftStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface EmailDraft {
  id: string;
  lead_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  template_id: string;
  status: EmailDraftStatus;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Partial<Lead>;
}

export interface SendAttempt {
  id: string;
  idempotency_key: string;
  draft_id: string | null;
  lead_id: string;
  recipient_email: string;
  status: 'pending' | 'sent' | 'failed' | 'blocked';
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  attempted_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  scheduled_at: string;
  notes: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  outcome: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  lead?: Partial<Lead>;
}

export interface ActivityLog {
  id: string;
  lead_id: string | null;
  action: string;
  description: string;
  actor: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  lead?: { company_name: string } | null;
}

export interface AppSettings {
  global_email_paused: boolean;
  daily_send_limit: number;
  company_profile: {
    name: string;
    phone: string;
    base_city: string;
    service_area: string;
    vehicle_type: string;
  };
  email_config?: {
    provider?: 'gmail' | 'resend' | 'none';
    gmail_user?: string;
    gmail_app_password?: string;
    resend_api_key?: string;
    resend_from_email?: string;
  };
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  repliesReceived: number;
  followupsDue: number;
  optedOutCount: number;
  confirmedEnquiries: number;
  confirmedOrders: number;
  actualRevenue: number;
  estimatedOpportunityValue: number;
  recentActivity: ActivityLog[];
  weeklyActivity: { day: string; count: number; date: string }[];
}

// SMS Gateway & Android SIM Companion Types
export type SmsJobStatus =
  | 'queued'
  | 'claimed'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'unknown';

export interface SmsDevice {
  id: string;
  device_name: string;
  device_model: string;
  phone_number: string;
  pairing_code?: string | null;
  pairing_code_expires_at?: string | null;
  auth_token_hash: string;
  status: 'online' | 'offline' | 'revoked';
  paired_at: string;
  last_seen_at: string;
  battery_level: number;
  is_charging: boolean;
  selected_sim_slot: number; // 0 for SIM 1, 1 for SIM 2
  sim_carrier?: string | null;
  sim_count: number;
  app_version?: string | null;
}

export interface SmsJob {
  id: string;
  lead_id: string;
  lead_company_name: string;
  recipient_phone: string;
  message_text: string;
  status: SmsJobStatus;
  device_id: string | null;
  sim_slot: number;
  idempotency_key: string;
  created_at: string;
  claimed_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  requires_manual_approval: boolean;
  approved_at: string | null;
}

export interface SmsSettings {
  enabled: boolean;
  daily_limit: number;
  sent_today: number;
  min_delay_seconds: number;
  followup_mode: 'email_only' | 'sms_only' | 'email_then_sms' | 'manual_approval_sms' | 'auto_sms';
  day0_channel: 'email' | 'sms';
  day2_delay_days: number;
  day4_delay_days: number;
  dlt_disclaimer_acknowledged: boolean;
  test_phone_number?: string | null;
}

export interface SmsTemplate {
  id: string;
  name: string;
  language: 'hinglish' | 'hindi' | 'english';
  category: string;
  template_text: string;
}

export interface ParsedAiLead {
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  category: string;
  address: string | null;
  city: string;
  route_area: string;
  vehicle_requirement: string;
  frequency: string;
  estimated_value: number;
  notes: string | null;
  is_duplicate?: boolean;
  duplicate_reason?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface AiImportResult {
  total_found: number;
  valid_count: number;
  duplicate_count: number;
  leads: ParsedAiLead[];
}

