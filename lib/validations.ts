import { z } from 'zod';

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  return clean.length > 0 ? clean : null;
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  // Strip non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // If Indian 10-digit number with country code 91 or leading 0, get standard 10 digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export const leadCreateSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  contact_name: z.string().trim().max(100).nullable().optional(),
  category: z.string().trim().default('Garment manufacturers and exporters'),
  email: z.string().trim().email('Invalid email address').nullable().optional().or(z.literal('')),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal('')),
  website: z.string().trim().max(255).nullable().optional().or(z.literal('')),
  address: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  city: z.string().trim().default('Noida'),
  source: z.string().trim().default('Manual research'),
  source_url: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  source_notes: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  vehicle_requirement: z.string().trim().default('Tata Ace Gold'),
  route_area: z.string().trim().default('Noida–Delhi NCR'),
  frequency: z.string().trim().default('On-demand'),
  status: z.enum([
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
  ]).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().trim().max(2000).nullable().optional().or(z.literal('')),
  estimated_value: z.coerce.number().min(0).default(0),
  actual_revenue: z.coerce.number().min(0).default(0),
  email_consent_status: z.string().trim().default('b2b_public_directory'),
  next_follow_up_date: z.string().nullable().optional().or(z.literal('')),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const draftCreateSchema = z.object({
  lead_id: z.string().min(1, 'Invalid lead ID'),
  template_id: z.string().default('tata_ace_noida_en'),
  custom_route: z.string().optional(),
  custom_vehicle: z.string().optional(),
});

export const draftApproveSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(300),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(5000),
  approved_by: z.string().trim().optional(),
});

export const emailSendSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Explicit user approval is required before sending.' }),
  }),
  idempotency_key: z.string().trim().min(8, 'Valid idempotency key is required'),
});

export const followupCreateSchema = z.object({
  lead_id: z.string().min(1, 'Invalid lead ID'),
  scheduled_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date/time is required',
  }),
  notes: z.string().trim().max(1000).nullable().optional().or(z.literal('')),
});

export const followupUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled', 'rescheduled']).optional(),
  outcome: z.string().trim().max(1000).nullable().optional(),
  scheduled_at: z.string().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const settingsUpdateSchema = z.object({
  global_email_paused: z.boolean().optional(),
  daily_send_limit: z.number().int().min(1).max(200).optional(),
  company_profile: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    base_city: z.string().optional(),
    service_area: z.string().optional(),
    vehicle_type: z.string().optional(),
  }).optional(),
  email_config: z.object({
    provider: z.enum(['gmail', 'resend', 'none']).optional(),
    gmail_user: z.string().optional().or(z.literal('')),
    gmail_app_password: z.string().optional().or(z.literal('')),
    resend_api_key: z.string().optional().or(z.literal('')),
    resend_from_email: z.string().optional().or(z.literal('')),
  }).optional(),
});
