'use client';

import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  Send,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Smartphone,
  Monitor,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { EmailDraft, Lead } from '@/lib/types';
import { EMAIL_TEMPLATES } from '@/lib/email-templates';

interface CampaignsTabProps {
  drafts: EmailDraft[];
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
  onSelectLeadForDraft: (lead: Lead) => void;
  onApproveDraft: (draftId: string, subject: string, body: string) => Promise<void>;
  onOpenSendModal: (lead: Lead) => void;
  globalPaused: boolean;
  dailySentCount: number;
  dailyLimit: number;
  busy: boolean;
}

export default function CampaignsTab({
  drafts,
  leads,
  loading,
  onRefresh,
  onSelectLeadForDraft,
  onApproveDraft,
  onOpenSendModal,
  globalPaused,
  dailySentCount,
  dailyLimit,
  busy,
}: CampaignsTabProps) {
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  function handleSelectDraft(draft: EmailDraft) {
    setSelectedDraft(draft);
    setEditSubject(draft.subject);
    setEditBody(draft.body);
    setIsEditing(false);
  }

  const filteredDrafts = drafts.filter((d) => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* HEADER & SAFETY CONTROLS BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Approved B2B Outreach
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Email Campaigns & Approval Workflow
          </h1>
          <p className="text-xs text-slate-500">
            Every email requires explicit human review and approval. No bulk spam.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-white border border-[#e7ebf2] rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SAFETY & LIMITS STATUS CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Global Pause Indicator */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            globalPaused
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                globalPaused ? 'bg-red-200 text-red-700' : 'bg-emerald-200 text-emerald-700'
              }`}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                Global Outbound Switch: {globalPaused ? 'PAUSED' : 'ACTIVE'}
              </div>
              <div className="text-[11px] opacity-80">
                {globalPaused
                  ? 'All email sending is currently blocked. Toggle in Settings to enable.'
                  : 'Outbound sending is active. Explicit approval still required per message.'}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Sending Limit Progress */}
        <div className="p-4 bg-white border border-[#e7ebf2] rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CONSERVATIVE DAILY SENDING LIMIT
            </div>
            <div className="text-lg font-extrabold text-[#172033] mt-0.5">
              {dailySentCount} of {dailyLimit} Sent Today
            </div>
            <div className="w-48 bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-[#3659e3] h-full rounded-full transition-all"
                style={{ width: `${Math.min((dailySentCount / dailyLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span className="block font-bold text-slate-700">{dailyLimit - dailySentCount}</span>
            <span>remaining</span>
          </div>
        </div>
      </div>

      {/* DRAFTS LIST & WORKFLOW AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: DRAFTS LIST */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-sm text-[#172033]">Outreach Drafts ({drafts.length})</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-medium"
            >
              <option value="all">All statuses</option>
              <option value="draft">Drafts</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredDrafts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No drafts found in this category. Generate one from a lead in the Leads tab.
              </div>
            ) : (
              filteredDrafts.map((d) => {
                const isSelected = selectedDraft?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDraft(d)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${
                      isSelected ? 'bg-blue-50/50 border-l-4 border-[#3659e3]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-[#172033] truncate max-w-[180px]">
                        {d.lead?.company_name || d.recipient_email}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : d.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {d.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 truncate w-full font-medium">
                      {d.subject}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between w-full mt-1">
                      <span>To: {d.recipient_email}</span>
                      <span>
                        {new Date(d.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DRAFT REVIEWER & SENDER */}
        <div className="lg:col-span-2 bg-white border border-[#e7ebf2] rounded-2xl shadow-sm p-5 flex flex-col h-[600px] overflow-hidden">
          {selectedDraft ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* DRAFT REVIEW HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-[#172033]">
                    Reviewing Outreach for {selectedDraft.lead?.company_name || selectedDraft.recipient_email}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recipient: <strong className="text-slate-800">{selectedDraft.recipient_email}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs text-slate-600">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1.5 rounded-md ${previewMode === 'desktop' ? 'bg-white shadow-sm font-bold text-[#3659e3]' : ''}`}
                      title="Desktop view"
                    >
                      <Monitor size={15} />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1.5 rounded-md ${previewMode === 'mobile' ? 'bg-white shadow-sm font-bold text-[#3659e3]' : ''}`}
                      title="Mobile view"
                    >
                      <Smartphone size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* EDITABLE SUBJECT & BODY */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => {
                      setEditSubject(e.target.value);
                      setIsEditing(true);
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#3659e3]"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Message Body (Rendered Email Content)
                  </label>

                  {previewMode === 'desktop' ? (
                    <textarea
                      rows={10}
                      value={editBody}
                      onChange={(e) => {
                        setEditBody(e.target.value);
                        setIsEditing(true);
                      }}
                      className="w-full text-xs p-3.5 border border-slate-200 rounded-xl outline-none font-sans leading-relaxed focus:border-[#3659e3]"
                    />
                  ) : (
                    <div className="max-w-[320px] mx-auto p-4 border border-slate-300 rounded-2xl bg-[#f8f9fd] shadow-inner text-xs leading-relaxed whitespace-pre-wrap">
                      <div className="border-b border-slate-200 pb-2 mb-3 text-[10px] font-bold text-[#3659e3] uppercase">
                        Mobile Inbox Preview
                      </div>
                      <div className="font-bold text-[11px] mb-2">{editSubject}</div>
                      <div className="text-slate-800">{editBody}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[11px] text-slate-400">
                  Status:{' '}
                  <strong className="text-slate-700 capitalize">{selectedDraft.status}</strong>
                  {selectedDraft.approved_at && (
                    <span>
                      {' '}
                      · Approved at {new Date(selectedDraft.approved_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || !editSubject.trim() || !editBody.trim()}
                    onClick={async () => {
                      await onApproveDraft(selectedDraft.id, editSubject, editBody);
                      setIsEditing(false);
                      setSelectedDraft({
                        ...selectedDraft,
                        subject: editSubject,
                        body: editBody,
                        status: 'approved',
                        approved_at: new Date().toISOString(),
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>{selectedDraft.status === 'approved' && !isEditing ? 'Re-Approve' : 'Explicitly Approve'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={
                      busy ||
                      selectedDraft.status !== 'approved' ||
                      isEditing ||
                      globalPaused ||
                      selectedDraft.lead?.opted_out
                    }
                    onClick={() => {
                      const associatedLead = leads.find((l) => l.id === selectedDraft.lead_id) || {
                        ...selectedDraft.lead,
                        id: selectedDraft.lead_id,
                        email: selectedDraft.recipient_email,
                        email_subject: selectedDraft.subject,
                        email_body: selectedDraft.body,
                        approved_at: selectedDraft.approved_at,
                        status: 'approved',
                      };
                      onOpenSendModal(associatedLead as Lead);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>Review & Send via Resend</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Mail size={32} className="text-slate-300" />
              <div className="text-center">
                <div className="font-bold text-slate-700 text-sm">Select a Draft to Review</div>
                <div className="text-xs text-slate-400 max-w-sm mt-1">
                  Choose a draft from the left column to view the personalized message, approve it, or transmit it safely.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
