import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NCR Transport Leads | Delhi NCR Freight Logistics', description: 'A simple private CRM for local transport leads and approved outreach.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
