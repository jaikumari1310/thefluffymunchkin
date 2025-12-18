import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[var(--sidebar-width)] min-h-screen transition-all duration-300">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
