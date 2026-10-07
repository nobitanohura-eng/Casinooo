import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Papa Transport Leads', description: 'A simple private CRM for local transport leads and approved outreach.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
