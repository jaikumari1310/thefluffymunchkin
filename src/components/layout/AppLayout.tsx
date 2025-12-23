import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { UserHeader } from './UserHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
 return (
   <div className="min-h-screen bg-background">
     <Sidebar />
     <main className="min-h-screen transition-all duration-300 md:ml-[var(--sidebar-width)]">
       {/* Top Header Bar */}
       <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
         <UserHeader />
       </header>
       <div className="container py-6">
         {children}
       </div>
     </main>
   </div>
 );
}