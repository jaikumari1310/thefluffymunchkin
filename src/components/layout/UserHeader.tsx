import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function UserHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium leading-tight">{user.displayName}</span>
              <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                {user.role === 'admin' && <Shield className="h-3 w-3" />}
                {user.role}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
