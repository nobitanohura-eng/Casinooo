import Link from 'next/link';
import { Truck, CheckCircle2 } from 'lucide-react';

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#172033] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e7ebf2] rounded-2xl max-w-lg w-full p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} />
        </div>

        <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-2">
          <Truck size={16} />
          NCR Transport Logistics · Noida NCR
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#172033] mb-3">
          You are unsubscribed
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Your email address has been permanently added to our central suppression list. You will not receive any further transport outreach or inquiries from our service.
        </p>

        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Status: Suppressed / Do Not Contact
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          <p>NCR Transport Logistics · Local B2B Commercial Vehicle Logistics · Delhi NCR</p>
        </div>
      </div>
    </main>
  );
}
