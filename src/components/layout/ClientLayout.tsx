"use client";

import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('./Providers'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 