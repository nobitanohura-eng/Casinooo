'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, Globe, MapPin, Truck, AlertCircle, Save } from 'lucide-react';
import { Lead, LEAD_CATEGORIES, LEAD_STATUSES } from '@/lib/types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: any) => Promise<void>;
  initialData?: Lead | null;
  busy: boolean;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  busy,
}: LeadModalProps) {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    category: 'Garment manufacturers and exporters',
    email: '',
    phone: '',
    website: '',
    city: 'Noida',
    address: '',
    source: 'Manual research',
    source_url: '',
    source_notes: '',
    vehicle_requirement: 'Tata Ace Gold',
    route_area: 'Noida–Delhi NCR',
    frequency: 'On-demand',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'new',
    notes: '',
    estimated_value: 0,
    actual_revenue: 0,
    next_follow_up_date: '',
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        company_name: initialData.company_name || '',
        contact_name: initialData.contact_name || '',
        category: initialData.category || 'Garment manufacturers and exporters',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        city: initialData.city || 'Noida',
        address: initialData.address || '',
        source: initialData.source || 'Manual research',
        source_url: initialData.source_url || '',
        source_notes: initialData.source_notes || '',
        vehicle_requirement: initialData.vehicle_requirement || 'Tata Ace Gold',
        route_area: initialData.route_area || 'Noida–Delhi NCR',
        frequency: initialData.frequency || 'On-demand',
        priority: initialData.priority || 'medium',
        status: initialData.status || 'new',
        notes: initialData.notes || '',
        estimated_value: initialData.estimated_value || 0,
        actual_revenue: initialData.actual_revenue || 0,
        next_follow_up_date: initialData.next_follow_up_date
          ? initialData.next_follow_up_date.slice(0, 10)
          : '',
      });
    } else {
      setForm({
        company_name: '',
        contact_name: '',
        category: 'Garment manufacturers and exporters',
        email: '',
        phone: '',
        website: '',
        city: 'Noida',
        address: '',
        source: 'Manual research',
        source_url: '',
        source_notes: '',
        vehicle_requirement: 'Tata Ace Gold',
        route_area: 'Noida–Delhi NCR',
        frequency: 'On-demand',
        priority: 'medium',
        status: 'new',
        notes: '',
        estimated_value: 0,
        actual_revenue: 0,
        next_follow_up_date: '',
      });
    }
    setFormError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setFormError('Company name is required');
      return;
    }
    try {
      await onSave({
        ...form,
        next_follow_up_date: form.next_follow_up_date
          ? new Date(`${form.next_follow_up_date}T10:00:00`).toISOString()
          : null,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save lead');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3659e3] flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#172033]">
                {initialData ? 'Edit Transport Lead' : 'Add New Business Lead'}
              </h2>
              <p className="text-xs text-slate-500">
                Delhi NCR local commercial vehicle customer profile
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

        {/* ERROR NOTIFICATION */}
        {formError && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* SECTION 1: BASIC BUSINESS IDENTITY */}
          <div>
            <div className="text-xs font-bold text-[#3659e3] uppercase tracking-wider mb-2">
              1. Business Information (Company Pahchan)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Paramount Garments Pvt. Ltd."
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person (Owner / Dispatch Manager)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry / Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                >
                  {LEAD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="info@paramountgarments.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Phone (Mobile / Office)
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98110 12345"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Noida Sector 63 / Okhla"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Factory / Warehouse Address
                </label>
                <input
                  type="text"
                  placeholder="Plot No. B-12, Sector 65, Noida, Uttar Pradesh 201301"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TRANSPORT & DELIVERY SPECS */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-[#3659e3] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Truck size={14} />
              2. Transport & Vehicle Requirements (Gaddi ki Zaroorat)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Needed
                </label>
                <select
                  value={form.vehicle_requirement}
                  onChange={(e) => setForm({ ...form, vehicle_requirement: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none bg-white"
                >
                  <option>Tata Ace Gold (Chota Hathi)</option>
                  <option>Pickup 8ft</option>
                  <option>14ft Canter</option>
                  <option>3-Wheeler Champion</option>
                  <option>Any Small Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Route / Service Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Noida to Okhla Phase 2"
                  value={form.route_area}
                  onChange={(e) => setForm({ ...form, route_area: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none bg-white"
                >
                  <option>On-demand (Kabhi-kabhi)</option>
                  <option>Daily regular trips</option>
                  <option>2–3 times per week</option>
                  <option>Weekly contract</option>
                  <option>Monthly arrangement</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: PIPELINE STATUS & REVENUE */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-[#3659e3] uppercase tracking-wider mb-2">
              3. CRM Status, Priority & Follow-up
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none bg-white"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.hindiLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none bg-white"
                >
                  <option value="low">Low (Aam)</option>
                  <option value="medium">Medium (Theek)</option>
                  <option value="high">High (Zaroori / Badi party)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={form.next_follow_up_date}
                  onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Revenue (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.actual_revenue}
                  onChange={(e) => setForm({ ...form, actual_revenue: Number(e.target.value) })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SOURCE & VERIFICATION NOTES */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-[#3659e3] uppercase tracking-wider mb-2">
              4. Verification Source & Notes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. IndiaMART / Google Maps / Factory Board"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Verification URL / Note
                </label>
                <input
                  type="text"
                  placeholder="https://... or Directory page"
                  value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes (Load size, packing type, best time to call)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Garment cartons load daily at 4 PM. Contact Ramesh ji directly."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#3659e3] outline-none"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{busy ? 'Saving…' : initialData ? 'Update Lead' : 'Save Business Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
