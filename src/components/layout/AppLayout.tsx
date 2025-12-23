import { ReactNode, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from './Sidebar';
import { UserHeader } from './UserHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <div className="min-h-screen bg-background">
          <main className="min-h-screen">
            {/* Top Header Bar */}
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <UserHeader />
            </header>
            <div className="container py-6">{children}</div>
          </main>
          <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
            <Sidebar />
          </SheetContent>
        </div>
      </Sheet>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen transition-all duration-300 md:ml-[var(--sidebar-width)]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <UserHeader />
        </header>
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}