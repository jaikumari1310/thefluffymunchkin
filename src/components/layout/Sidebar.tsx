import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', adminOnly: false },
  { icon: Receipt, label: 'New Bill', path: '/billing', adminOnly: false },
  { icon: FileText, label: 'Invoices', path: '/invoices', adminOnly: false },
  { icon: Users, label: 'Customers', path: '/customers', adminOnly: false },
  { icon: Package, label: 'Products', path: '/products', adminOnly: false },
  { icon: BarChart3, label: 'Reports', path: '/reports', adminOnly: false },
  { icon: UserCog, label: 'Users', path: '/users', adminOnly: true },
  { icon: Settings, label: 'Settings', path: '/settings', adminOnly: false },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <IndianRupee className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">The Fluffy Munchkin</span>
              <span className="text-xs text-sidebar-foreground/60">Billing System</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary-foreground')} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/70 shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="absolute bottom-4 left-3 right-3">
          <NavLink
            to="/billing"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-all hover:opacity-90"
          >
            <Receipt className="h-4 w-4" />
            Quick Bill
          </NavLink>
        </div>
      )}
    </aside>
  );
}
