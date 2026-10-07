-- ==============================================================================
-- PAPA TRANSPORT LEADS — COMPREHENSIVE PRODUCTION SCHEMA
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. CENTRAL SUPPRESSIONS TABLE
-- Survives lead deletions and re-imports. Prevents any outreach to opted-out addresses.
create table if not exists public.suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null unique,
  reason text not null default 'unsubscribe' check (reason in ('unsubscribe', 'bounce', 'complaint', 'manual_request', 'admin_suppressed')),
  source text default 'optout_link',
  created_at timestamptz not null default now()
);

create index if not exists suppressions_norm_email_idx on public.suppressions(normalized_email);

-- 2. LEADS TABLE
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  category text not null default 'Garment manufacturers and exporters',
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  website text,
  address text,
  city text default 'Noida',
  source text default 'Manual research',
  source_url text,
  source_notes text,
  vehicle_requirement text default 'Tata Ace Gold',
  route_area text default 'Noida–Delhi NCR',
  frequency text default 'On-demand',
  status text not null default 'new' check (
    status in (
      'new',
      'researching',
      'ready_for_review',
      'contacted',
      'replied',
      'interested',
      'quotation_requested',
      'order_confirmed',
      'not_interested',
      'do_not_contact',
      'customer',
      'drafted',
      'approved'
    )
  ),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  notes text,
  estimated_value numeric default 0,
  actual_revenue numeric default 0,
  email_consent_status text default 'b2b_public_directory',
  opted_out boolean not null default false,
  optout_token uuid not null default gen_random_uuid(),
  email_subject text,
  email_body text,
  approved_at timestamptz,
  sent_at timestamptz,
  last_contact_date timestamptz,
  next_follow_up_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique index for duplicate prevention
create unique index if not exists leads_norm_email_unique on public.leads(normalized_email)
  where normalized_email is not null and normalized_email <> '';

create index if not exists leads_norm_phone_idx on public.leads(normalized_phone)
  where normalized_phone is not null and normalized_phone <> '';

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_priority_idx on public.leads(priority);
create index if not exists leads_followup_idx on public.leads(next_follow_up_date) where opted_out = false;
create index if not exists leads_optout_token_idx on public.leads(optout_token);

-- 3. EMAIL DRAFTS TABLE
create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  body text not null,
  template_id text default 'tata_ace_noida_en',
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'sending', 'sent', 'failed', 'cancelled')),
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_drafts_lead_id_idx on public.email_drafts(lead_id);
create index if not exists email_drafts_status_idx on public.email_drafts(status);

-- 4. SEND ATTEMPTS (Durable Idempotency & Audit)
create table if not exists public.send_attempts (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  draft_id uuid references public.email_drafts(id) on delete set null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'blocked')),
  provider text not null default 'resend',
  provider_message_id text,
  error_message text,
  attempted_at timestamptz not null default now()
);

create index if not exists send_attempts_key_idx on public.send_attempts(idempotency_key);
create index if not exists send_attempts_lead_idx on public.send_attempts(lead_id);

-- 5. EMAIL EVENTS (Resend Webhook Events: Delivery, Bounces, Complaints)
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  provider_message_id text not null,
  event_type text not null check (event_type in ('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'delivery_delayed')),
  recipient_email text,
  lead_id uuid references public.leads(id) on delete set null,
  payload jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists email_events_msg_id_idx on public.email_events(provider_message_id);

-- 6. FOLLOW-UPS TABLE
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled', 'rescheduled')),
  outcome text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists follow_ups_lead_idx on public.follow_ups(lead_id);
create index if not exists follow_ups_sched_idx on public.follow_ups(scheduled_at);
create index if not exists follow_ups_status_idx on public.follow_ups(status);

-- 7. ACTIVITY LOGS (Audit Trail)
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  action text not null,
  description text not null,
  actor text not null default 'Owner',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_lead_idx on public.activity_logs(lead_id);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

-- 8. APP SETTINGS (Global Configuration)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed default settings if not exists
insert into public.app_settings (key, value)
values
  ('global_email_paused', 'true'::jsonb),
  ('daily_send_limit', '25'::jsonb),
  ('company_profile', '{"name":"Papa Transport Services","phone":"+91 98110 00000","base_city":"Noida","service_area":"Noida–Delhi NCR","vehicle_type":"Tata Ace Gold (Chota Hathi)"}'::jsonb)
on conflict (key) do nothing;

-- 9. ROW LEVEL SECURITY (RLS)
alter table public.suppressions enable row level security;
alter table public.leads enable row level security;
alter table public.email_drafts enable row level security;
alter table public.send_attempts enable row level security;
alter table public.email_events enable row level security;
alter table public.follow_ups enable row level security;
alter table public.activity_logs enable row level security;
alter table public.app_settings enable row level security;

-- Direct browser/anon table access is denied. All mutations go through server route handlers using service-role after strict authentication & allowlist checks.
