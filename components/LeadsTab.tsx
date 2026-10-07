'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Phone,
  Mail,
  Truck,
  MapPin,
  Clock,
  ShieldAlert,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Lead, LEAD_CATEGORIES, LEAD_STATUSES } from '@/lib/types';

interface LeadsTabProps {
  leads: Lead[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (val: string) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onBulkAction: (action: string, leadIds: string[], status?: string) => Promise<void>;
  busy: boolean;
}

export default function LeadsTab({
  leads,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onSelectLead,
  onOpenAddModal,
  onOpenImportModal,
  onExportCsv,
  onBulkAction,
  busy,
}: LeadsTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('contacted');

  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  }

  function toggleSelectOne(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Party Database
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Transport Business Leads
          </h1>
          <p className="text-xs text-slate-500">
            Garment exporters, packaging suppliers, and warehouses in Noida NCR.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExportCsv}
            title="Download CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7ebf2] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e7ebf2] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Upload size={15} />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Naya Lead</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl p-3 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* SEARCH */}
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, phone, email, area, route…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#3659e3]"
            />
          </div>

          {/* STATUS FILTER */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">All Statuses (Sabhi status)</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.hindiLabel})
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY FILTER */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">All Categories (Sabhi kaam)</option>
              {LEAD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BULK ACTION BAR IF SELECTED */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="font-bold text-[#3659e3] flex items-center gap-2">
              <span>{selectedIds.length} leads selected</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Bulk automated sending is disabled for safety)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none font-medium"
              >
                <option value="contacted">Mark Contacted</option>
                <option value="interested">Mark Interested</option>
                <option value="ready_for_review">Mark Ready for Review</option>
                <option value="do_not_contact">Mark Do Not Contact</option>
              </select>

              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await onBulkAction('update_status', selectedIds, bulkStatus);
                  setSelectedIds([]);
                }}
                className="px-3 py-1 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Apply
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (confirm(`Delete ${selectedIds.length} selected leads?`)) {
                    await onBulkAction('delete', selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                title="Delete selected"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LEADS LIST / CARDS */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl shadow-sm overflow-hidden">
        {/* TABLE HEADER (Desktop) */}
        <div className="hidden md:flex items-center px-4 py-3 bg-slate-50 border-b border-[#e7ebf2] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-8">
            <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-slate-600">
              {isAllSelected ? <CheckSquare size={16} className="text-[#3659e3]" /> : <Square size={16} />}
            </button>
          </div>
          <div className="flex-1">Company & Route Details</div>
          <div className="w-48">Contact Information</div>
          <div className="w-36">Status & Priority</div>
          <div className="w-28 text-right">Follow-up Due</div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading leads list…</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3659e3] flex items-center justify-center mx-auto">
              <Truck size={24} />
            </div>
            <h3 className="text-base font-bold text-[#172033]">No Leads Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try clearing your search query or filters to see all leads.'
                : 'Start by adding local garment exporters, packaging units, or factories in your area.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-[#3659e3] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Add First Business Lead
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const isDue =
                lead.next_follow_up_date &&
                new Date(lead.next_follow_up_date) <= new Date() &&
                !lead.opted_out;

              const statusObj = LEAD_STATUSES.find((s) => s.value === lead.status) || {
                label: lead.status,
                hindiLabel: '',
                color: 'blue',
              };

              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* SELECT CHECKBOX (Desktop) */}
                  <div className="hidden md:block w-8">
                    <button
                      onClick={(e) => toggleSelectOne(lead.id, e)}
                      className="p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[#3659e3]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </div>

                  {/* COMPANY INFO & TRANSPORT BADGES */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#172033] tracking-tight hover:text-[#3659e3]">
                        {lead.company_name}
                      </span>

                      {lead.priority === 'high' && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-red-100 text-red-700 rounded-md">
                          High
                        </span>
                      )}

                      {lead.opted_out && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-50 text-red-600 rounded-md flex items-center gap-1">
                          <ShieldAlert size={10} />
                          Suppressed
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{lead.category}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin size={12} className="text-slate-400" />
                        {lead.city || 'Noida NCR'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[#3659e3] font-semibold">
                        <Truck size={12} />
                        {lead.vehicle_requirement || 'Tata Ace'} ({lead.route_area || 'NCR'})
                      </span>
                    </div>
                  </div>

                  {/* CONTACT & DIRECT ACTION BUTTONS (Click-to-call) */}
                  <div className="w-full md:w-48 text-xs flex items-center md:flex-col md:items-start gap-2 text-slate-600">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Phone size={12} />
                        <span>{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <AlertCircle size={12} /> No phone
                      </span>
                    )}

                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-[#3659e3] text-[11px] truncate max-w-[160px]"
                        title={lead.email}
                      >
                        <Mail size={12} />
                        <span className="truncate">{lead.email}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No email</span>
                    )}
                  </div>

                  {/* STATUS & REVENUE */}
                  <div className="w-full md:w-36 flex items-center md:flex-col md:items-start justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        lead.status === 'new'
                          ? 'bg-blue-50 text-blue-700'
                          : lead.status === 'contacted'
                          ? 'bg-amber-50 text-amber-700'
                          : lead.status === 'interested' || lead.status === 'order_confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : lead.status === 'do_not_contact'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusObj.label}
                    </span>
                    {lead.actual_revenue > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        ₹{lead.actual_revenue.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* FOLLOW-UP STATUS & RIGHT CHEVRON */}
                  <div className="w-full md:w-28 flex items-center justify-between md:justify-end gap-2 text-right">
                    {lead.next_follow_up_date && !lead.opted_out ? (
                      <div
                        className={`text-[11px] flex items-center gap-1 font-semibold ${
                          isDue ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        <Clock size={12} />
                        <span>
                          {new Date(lead.next_follow_up_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">None set</span>
                    )}

                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-[#e7ebf2] text-[11px] text-slate-500 flex items-center justify-between">
          <span>Showing {leads.length} transport leads</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Private Business Workspace
          </span>
        </div>
      </div>
    </div>
  );
}
