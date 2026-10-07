'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [importedResult, setImportedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  async function handlePreview() {
    if (!csvText.trim()) {
      setError('Please paste CSV text or load a file first.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', csvContent: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setPreviewResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not validate CSV');
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'execute', csvContent: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportedResult(data);
      onImportSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import leads');
    } finally {
      setBusy(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setPreviewResult(null);
      setImportedResult(null);
    };
    reader.readAsText(file);
  }

  const sampleCsv = `company_name,contact_name,category,email,phone,city,vehicle_requirement
"ABC Garments Pvt Ltd","Sunil Jain","Garment manufacturers and exporters","sunil@abcgarments.com","9811122334","Noida Sector 63","Tata Ace Gold"
"Delta Packaging Supplies","Vikram Roy","Packaging suppliers","vikram@deltapack.com","9822233445","Noida Sector 8","Pickup 8ft"`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3659e3] flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#172033]">
                Import Business Leads from CSV
              </h2>
              <p className="text-xs text-slate-500">
                Automatic duplicate detection & central suppression checking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {importedResult ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">Leads Successfully Imported!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Added <strong className="text-emerald-700">{importedResult.importedCount}</strong> new leads to your CRM.
                Skipped {importedResult.duplicateCount} duplicate companies and marked {importedResult.suppressedCount} suppressed contacts.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-[#3659e3] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Close & View Leads
              </button>
            </div>
          ) : (
            <>
              {/* FILE UPLOAD INPUT */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select CSV File or Paste Raw CSV Text
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#3659e3] hover:file:bg-blue-100 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setCsvText(sampleCsv)}
                    className="text-[11px] text-[#3659e3] font-semibold hover:underline"
                  >
                    Paste sample template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setPreviewResult(null);
                  }}
                  placeholder="Paste CSV rows here (e.g. company_name, email, phone, city...)"
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>

              {/* PREVIEW SUMMARY */}
              {previewResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-[#172033] flex items-center justify-between">
                    <span>Validation Preview Summary</span>
                    <span className="text-slate-400 font-normal">
                      Total: {previewResult.total} rows
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                      <div className="font-bold text-base">{previewResult.validCount}</div>
                      <div className="text-[10px]">Valid & Ready</div>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                      <div className="font-bold text-base">{previewResult.duplicateCount}</div>
                      <div className="text-[10px]">Duplicates (Skipped)</div>
                    </div>
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      <div className="font-bold text-base">{previewResult.suppressedCount}</div>
                      <div className="text-[10px]">Suppressed (Blocked)</div>
                    </div>
                  </div>

                  {previewResult.duplicateCount > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-lg">
                      <strong>Duplicate Protection:</strong> {previewResult.duplicateCount} rows already exist by normalized email or phone and will not create duplicate entries.
                    </div>
                  )}

                  {previewResult.suppressedCount > 0 && (
                    <div className="text-[11px] text-red-700 bg-red-50/50 p-2 rounded-lg flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      <span>{previewResult.suppressedCount} recipients are on the central opt-out list and will be automatically marked as "Do Not Contact".</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!importedResult && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {!previewResult ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={busy || !csvText.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <FileText size={16} />
                <span>{busy ? 'Validating…' : 'Preview & Validate'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecute}
                disabled={busy || previewResult.validCount === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{busy ? 'Importing…' : `Import ${previewResult.validCount} Valid Leads`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
