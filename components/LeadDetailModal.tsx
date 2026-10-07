'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  Truck,
  Calendar,
  Clock,
  ShieldAlert,
  Send,
  FileText,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Lead, LEAD_STATUSES } from '@/lib/types';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => Promise<void>;
  onGenerateDraft: (lead: Lead) => Promise<void>;
  onApproveDraft: (lead: Lead, subject: string, body: string) => Promise<void>;
  onSendEmail: (lead: Lead) => void;
  onUpdateStatus: (lead: Lead, status: string, followUpDate?: string, revenue?: number) => Promise<void>;
  onSuppress: (lead: Lead) => Promise<void>;
  busy: boolean;
}

export default function LeadDetailModal({
  lead,
  onClose,
  onEdit,
  onDelete,
  onGenerateDraft,
  onApproveDraft,
  onSendEmail,
  onUpdateStatus,
  onSuppress,
  busy,
}: LeadDetailModalProps) {
  if (!lead) return null;

  const [currentStatus, setCurrentStatus] = useState(lead.status);
  const [followUpDate, setFollowUpDate] = useState(
    lead.next_follow_up_date ? lead.next_follow_up_date.slice(0, 10) : ''
  );
  const [actualRevenue, setActualRevenue] = useState(lead.actual_revenue || 0);

  const [draftSubject, setDraftSubject] = useState(lead.email_subject || '');
  const [draftBody, setDraftBody] = useState(lead.email_body || '');
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const hasDraft = Boolean(lead.email_subject && lead.email_body);
  const isApproved = lead.status === 'approved' && Boolean(lead.approved_at);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="text-[10px] font-bold text-[#3659e3] uppercase tracking-wider mb-1">
              {lead.category} · {lead.city}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
              {lead.company_name}
            </h2>
            {lead.contact_name && (
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: <strong className="text-slate-700">{lead.contact_name}</strong>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* SUPPRESSION BANNER IF OPTED OUT */}
        {lead.opted_out && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <div>
              <strong>Suppressed Recipient:</strong> This lead has opted out or was marked "Do Not Contact". All automated outreach and follow-ups are permanently blocked.
            </div>
          </div>
        )}

        {/* QUICK COMMUNICATION ACTION BAR (Click-to-call, Click-to-email) */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-100 flex items-center gap-2 flex-wrap">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors touch-manipulation"
            >
              <Phone size={15} />
              <span>Call: {lead.phone}</span>
            </a>
          ) : (
            <div className="flex-1 min-w-[140px] px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs text-center">
              No Phone Listed
            </div>
          )}

          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#3659e3] border border-blue-200 rounded-xl text-xs font-bold transition-colors touch-manipulation"
            >
              <Mail size={15} />
              <span className="truncate">{lead.email}</span>
            </a>
          ) : (
            <div className="flex-1 min-w-[140px] px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs text-center">
              No Email Listed
            </div>
          )}

          <button
            onClick={() => onEdit(lead)}
            title="Edit lead details"
            className="p-2.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {/* SCROLLABLE DETAIL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TRANSPORT & ROUTE HIGHLIGHT CARD */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3659e3] uppercase tracking-wider mb-2">
              <Truck size={16} />
              <span>Commercial Freight Requirements (Gaddi ka Kaam)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">VEHICLE TYPE</span>
                <strong className="text-slate-800 text-sm">
                  {lead.vehicle_requirement || 'Tata Ace Gold'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">DELIVERY ROUTE</span>
                <strong className="text-slate-800 text-sm">
                  {lead.route_area || 'Noida–Delhi NCR'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">FREQUENCY</span>
                <strong className="text-slate-800 text-sm">{lead.frequency || 'On-demand'}</strong>
              </div>
            </div>
          </div>

          {/* STATUS, FOLLOW-UP & REVENUE UPDATE */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
              <span>Status & Follow-up Controls</span>
              <span className="text-[10px] text-slate-400">Update anytime</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lead Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.hindiLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Recorded Revenue (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={actualRevenue}
                  onChange={(e) => setActualRevenue(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onUpdateStatus(
                    lead,
                    currentStatus,
                    followUpDate ? new Date(`${followUpDate}T10:00:00`).toISOString() : undefined,
                    actualRevenue
                  )
                }
                className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Save Status & Follow-up
              </button>
            </div>
          </div>

          {/* EMAIL DRAFT & OUTREACH WORKFLOW */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[#3659e3]" />
                <span className="text-xs font-bold text-[#172033]">Email Outreach Workflow</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  lead.sent_at
                    ? 'bg-emerald-100 text-emerald-800'
                    : isApproved
                    ? 'bg-blue-100 text-blue-800'
                    : hasDraft
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lead.sent_at
                  ? 'Sent'
                  : isApproved
                  ? 'Approved (Ready to send)'
                  : hasDraft
                  ? 'Draft Generated'
                  : 'No Draft'}
              </span>
            </div>

            {hasDraft ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => {
                      setDraftSubject(e.target.value);
                      setIsEditingDraft(true);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Message Body (Personalized)
                  </label>
                  <textarea
                    rows={6}
                    value={draftBody}
                    onChange={(e) => {
                      setDraftBody(e.target.value);
                      setIsEditingDraft(true);
                    }}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || lead.opted_out}
                    onClick={() => onGenerateDraft(lead)}
                    className="text-xs text-[#3659e3] font-semibold hover:underline"
                  >
                    Regenerate from template
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || lead.opted_out || !draftSubject.trim() || !draftBody.trim()}
                      onClick={async () => {
                        await onApproveDraft(lead, draftSubject, draftBody);
                        setIsEditingDraft(false);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>{isApproved && !isEditingDraft ? 'Re-Approve Draft' : 'Approve Draft'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy || lead.opted_out || !isApproved || isEditingDraft}
                      onClick={() => onSendEmail(lead)}
                      className="px-4 py-2 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>Review & Send</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl">
                <FileText size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 mb-3">
                  No email draft has been generated for this lead yet.
                </p>
                <button
                  type="button"
                  disabled={busy || lead.opted_out || !lead.email}
                  onClick={() => onGenerateDraft(lead)}
                  className="px-4 py-2 bg-blue-50 text-[#3659e3] border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Generate Personalized Draft
                </button>
              </div>
            )}
          </div>

          {/* OTHER DETAILS & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Address</span>
              <p className="text-slate-700 mt-1">{lead.address || 'Address not recorded'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                Source & Verification
              </span>
              <p className="text-slate-700 mt-1">
                {lead.source} {lead.source_url ? `(${lead.source_url})` : ''}
              </p>
            </div>
            {lead.notes && (
              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Notes</span>
                <p className="text-slate-700 mt-1">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            disabled={busy || lead.opted_out}
            onClick={() => onSuppress(lead)}
            className="text-xs text-red-600 hover:text-red-800 font-semibold"
          >
            Suppress / Do Not Contact
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (confirm(`Are you sure you want to delete lead "${lead.company_name}"?`)) {
                await onDelete(lead.id);
                onClose();
              }
            }}
            className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1"
          >
            <Trash2 size={14} />
            <span>Delete Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
