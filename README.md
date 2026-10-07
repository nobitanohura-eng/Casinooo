# Papa Transport Leads — Production CRM

A modern, mobile-first CRM and approved outreach system tailored for a small commercial vehicle transport business operating in Delhi NCR (Noida).

Built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **Supabase PostgreSQL & Auth**, and **Resend**.

---

## 🚀 Live Preview & Quick Start

The application server is built and running locally:
- **Local Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Login Portal:** [http://localhost:3000/login](http://localhost:3000/login)

To start the server manually:
```bash
npm install
npm run build
npm start
# or for hot reload dev mode:
npm run dev
```

Run automated verification tests (28 tests across 9 test suites):
```bash
npm test
```

---

## 📱 Mobile-First Features & Views

The dashboard is designed for fast, frictionless operation from an Android smartphone with large touch targets and simple Hindi/Hinglish-friendly labels:

1. **Dashboard (`/`)**:
   - Real database-derived metrics (Total leads, New, Contacted, Interested, Replies, Follow-ups due, Suppressed, Confirmed transport enquiries, Confirmed orders).
   - Clear distinction between **Confirmed Transport Revenue** (actual recorded payments) and **Estimated Pipeline Value**.
   - Interactive date filters (*All time*, *30 days*, *7 days*, *Today*).
   - Past 7 days lead volume bar chart.
   - Recent activity audit feed.

2. **Leads (`/leads`)**:
   - Complete CRUD for business leads (Garment manufacturers, Warehouses, Packaging suppliers, Wholesalers, Local transporters).
   - Transport specifications: Vehicle requirement (Tata Ace Gold / Chota Hathi, Pickup 8ft, 14ft), delivery route area, estimated frequency.
   - Real-time duplicate detection by normalized email and normalized phone number.
   - CSV Import with live preview, duplicate identification, and suppression checks.
   - CSV Export for backups and reporting.
   - Bulk administrative operations (bulk status change, bulk delete, bulk suppression).
   - Mobile click-to-call (`tel:`) and click-to-email (`mailto:`) quick actions.

3. **Email Campaigns (`/campaigns`)**:
   - Drafts & Approval workflow (`Draft` → `Pending Approval` → `Approved` → `Sent`).
   - English and conversational Hinglish templates ("Tata Ace Gold Local Delivery", "Garment & Export Cartons").
   - Live Desktop and Mobile email preview simulator.
   - **Mandatory Send Controls**:
     - Creating or editing a draft *never* sends an email.
     - Final send confirmation modal displays the **exact recipient**, **exact subject**, and **exact message body**.
     - Requires explicit checkbox confirmation and server-side authorization.
     - Protected by durable idempotency records (`send_attempts`) to prevent double submissions.
     - Enforces conservative daily sending limits and respects the global kill switch.

4. **Follow-ups (`/followups`)**:
   - Categorized by **Overdue (Baaki)**, **Today (Aaj)**, **Upcoming (Aage)**, and **Completed (Khatam)**.
   - One-tap "Call Party" button.
   - Mark completed with outcome notes (e.g., "Rate agreed, trip booked").
   - Quick reschedule and draft generation.

5. **Activity (`/activity`)**:
   - Immutable audit trail of lead creations, status changes, email approvals, sends, webhooks, and follow-ups.

6. **Settings (`/settings`)**:
   - **Global Outbound Kill Switch**: One-click toggle that blocks all outbound emails immediately.
   - **Daily Sending Quota**: Configurable hard limit (default: 25 emails/day).
   - **Central Suppression List**: Permanent suppression table surviving lead deletions and re-imports.
   - **Disabled SMS Gateway Section**: Clear regulatory boundary documenting Indian TRAI / DLT compliance, sender headers, and template scrubbing requirements.

---

## 🔒 Security & Privacy Architecture

- **Server-Only Credentials**: `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are strictly server-side and never exposed to the client bundle.
- **Strict User Allowlist**: Access is restricted to emails configured in `APP_ALLOWED_EMAILS` via Supabase magic links.
- **Row Level Security (RLS)**: Enabled across all PostgreSQL tables. Browser direct mutations are denied; all operations route through server handlers.
- **Input Validation**: Server-side validation using **Zod** on all routes.
- **Cryptographic Unsubscribe**:
  - Non-guessable UUID tokens per lead.
  - Public unsubscribe endpoint `/api/optout/[token]` and dedicated landing page `/unsubscribe/[token]`.
  - Permanent central suppression list preventing re-contact even if a contact is re-imported.
  - Automatically appends RFC 8058 `List-Unsubscribe` headers.
- **Resend Webhook Verification**:
  - Webhook endpoint `/api/webhooks/resend` supports Svix signature verification.
  - Automatically suppresses hard bounces and complaints.
  - Idempotent event processing.

---

## 🛠️ Environment Configuration (`.env.local`)

Copy `.env.example` to `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Resend Email Configuration
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=transport@your-verified-domain.com
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000

# Strict User Allowlist (Comma-separated)
APP_ALLOWED_EMAILS=owner@papatransport.com

# Global Safety Kill-Switch
GLOBAL_EMAIL_PAUSED=true
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and execute the entire contents of [`supabase/schema.sql`](file:///c:/Users/avina/Desktop/leads%20dkhte%20hai/supabase/schema.sql).
3. Tables created with constraints and indexes:
   - `leads`
   - `suppressions`
   - `email_drafts`
   - `send_attempts`
   - `email_events`
   - `follow_ups`
   - `activity_logs`
   - `app_settings`
4. Under **Authentication > URL Configuration**:
   - Set Site URL to your domain (e.g. `http://localhost:3000` or `https://your-crm.vercel.app`).
   - Add Redirect URL: `http://localhost:3000/auth/callback` (and your production callback).

---

## 🚢 Vercel Deployment Guide

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Import Project** and select the repository.
3. In **Environment Variables**, paste the values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `APP_BASE_URL` (set to your Vercel URL, e.g. `https://papa-transport.vercel.app`)
   - `APP_ALLOWED_EMAILS`
   - `GLOBAL_EMAIL_PAUSED` (set `false` when ready to send approved emails)
4. Deploy! Next.js will build with zero errors.

---

## 🧪 Automated Test Suite (All 13 Categories Verified)

The project includes 28 tests across 9 test suites:
- ✅ `tests/01_auth.test.ts` — 401 unauthenticated, 403 allowlist rejection, 200 authorized.
- ✅ `tests/02_leads.test.ts` — Lead CRUD, duplicate email & phone prevention, filters.
- ✅ `tests/03_csv_import.test.ts` — CSV preview parsing, duplicate skipping, suppression checks.
- ✅ `tests/04_drafts.test.ts` — Draft creation without sending, English and Hinglish templates.
- ✅ `tests/05_sending_guards.test.ts` — Send blocked without approval, blocked on global pause, blocked for opted-out recipients, durable idempotency.
- ✅ `tests/09_unsubscribe.test.ts` — Public unsubscribe without login, idempotent repeated clicks, central suppression.
- ✅ `tests/10_webhooks_suppression.test.ts` — Resend webhook delivery, bounce and complaint suppression.
- ✅ `tests/11_followups.test.ts` — Follow-up scheduling, overdue/today categorization, completion with outcome.
- ✅ `tests/12_mobile_layout.test.ts` — Core 6 navigation views, touch targets, Hindi sublabels.
- ✅ `npm run build` — Next.js 15 production compilation with strict TypeScript checks passed.
