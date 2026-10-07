'use client';

import React, { useState } from 'react';
import { X, Sparkles, Upload, CheckCircle2, AlertTriangle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { ParsedAiLead, AiImportResult } from '@/lib/types';

interface AiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function AiImportModal({ isOpen, onClose, onImportComplete }: AiImportModalProps) {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<AiImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  async function handleParse() {
    if (!content.trim()) {
      setError('Please paste your research table, markdown text, or notes first.');
      return;
    }
    setParsing(true);
    setError('');
    setPreview(null);

    try {
      const res = await fetch('/api/leads/import-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse text');
      setPreview(data.preview);
    } catch (err: any) {
      setError(err.message || 'Parsing failed');
    } finally {
      setParsing(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError('');
    };
    reader.readAsText(file);
  }

  async function handleCommitImport() {
    if (!preview || preview.leads.length === 0) return;
    setImporting(true);
    setError('');

    try {
      const res = await fetch('/api/leads/import-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'commit',
          leads_to_import: preview.leads.filter((l) => !l.is_duplicate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import leads');

      setSuccessMsg(data.message || 'Leads successfully imported!');
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Import AI Research & Markdown</h2>
              <p className="text-xs text-slate-500 font-medium">
                Paste tables or .md from ChatGPT, Claude, Perplexity, or any AI bot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!preview ? (
            <>
              {/* File upload shortcut */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <FileText size={16} className="text-blue-600" />
                  <span>Upload .md / .txt file</span>
                </div>
                <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm">
                  Browse File
                  <input
                    type="file"
                    accept=".md,.txt,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Paste AI Output / Markdown Table / Notes
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Example Markdown table or text from ChatGPT:\n\n| Company Name | Contact Person | Phone | Email | Address |\n| Modern Apparel Fab | Rahul Tyagi | 98112 34567 | rahul@modern.in | Sector 63 Noida |\n| Balaji Tools & Dies | Manoj Gupta | 98991 22334 | manoj@balaji.co.in | Phase 2 Okhla |`}
                  rows={8}
                  className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Supports any table format, bulleted list, JSON, or raw contact info. Phone numbers and emails are automatically normalized.
                </p>
              </div>

              <button
                onClick={handleParse}
                disabled={parsing || !content.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
              >
                {parsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Parse & Extract Leads</span>
              </button>
            </>
          ) : (
            /* Preview Screen */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-blue-700">{preview.total_found}</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase">Found</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-emerald-700">{preview.valid_count}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Valid New</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-amber-700">{preview.duplicate_count}</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase">Duplicates</div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {preview.leads.map((lead, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      lead.is_duplicate
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold flex items-center gap-2 truncate">
                        <span>{lead.company_name}</span>
                        {lead.contact_name && (
                          <span className="text-[11px] font-normal text-slate-500">
                            ({lead.contact_name})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                        {lead.phone && <span>📞 {lead.phone}</span>}
                        {lead.email && <span>✉️ {lead.email}</span>}
                        <span>📍 {lead.city}</span>
                        <span>🏷️ {lead.category}</span>
                      </div>
                      {lead.is_duplicate && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          ⚠️ Skipped: {lead.duplicate_reason}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        lead.is_duplicate
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {lead.is_duplicate ? 'Duplicate' : 'Ready'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Edit Input Text
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={importing || preview.valid_count === 0}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                >
                  {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Import {preview.valid_count} Leads into CRM</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
