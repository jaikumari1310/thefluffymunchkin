import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Key,
  Mail,
  Shield,
  UserCheck,
  Loader2,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type ApprovedGoogleUser = Database['public']['Tables']['approved_google_users']['Row'];
type UserRole = UserProfile['role'];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [approvedGoogleUsers, setApprovedGoogleUsers] = useState<ApprovedGoogleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddGoogleUser, setShowAddGoogleUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'staff' as UserRole });
  const [newPassword, setNewPassword] = useState('');
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleRole, setNewGoogleRole] = useState<UserRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, googleUsersRes] = await Promise.all([
        supabase.from('user_profiles').select('*'),
        supabase.from('approved_google_users').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (googleUsersRes.error) throw googleUsersRes.error;

      setUserProfiles(profilesRes.data || []);
      setApprovedGoogleUsers(googleUsersRes.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.displayName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            display_name: newUser.displayName,
            role: newUser.role,
          },
        },
      });

      if (authError) throw authError;
      if (!user) throw new Error('User creation failed');
      
      toast.success('User created successfully. Please check email for verification.');
      setShowAddUser(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'staff' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: selectedUser.display_name,
          role: selectedUser.role,
          is_active: selectedUser.is_active,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      toast.success('User updated successfully');
      setShowEditUser(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    // This requires admin privileges and is a server-side operation
    toast.info("Password changes from this panel are not yet implemented.");
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.display_name}? This is irreversible.`)) return;

    // This requires admin privileges and is a server-side operation
    toast.info("User deletion from this panel is not yet implemented.");
  };

  const handleAddGoogleUser = async () => {
    const email = newGoogleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('approved_google_users').insert({ email, role: newGoogleRole });
      if (error) throw error;
      toast.success('Approved Google user added');
      setShowAddGoogleUser(false);
      setNewGoogleEmail('');
      setNewGoogleRole('staff');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add approved Google user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGoogleUser = async (email: string) => {
    if (!confirm(`Remove ${email} from approved list?`)) return;

    try {
      const { error } = await supabase.from('approved_google_users').delete().eq('email', email);
      if (error) throw error;
      toast.success('Removed from approved list');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove approved user');
    }
  };

  if (isLoading) {
    return (
      <AppLayout><div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage users and access permissions</p>
          </div>
        </div>

        {/* Standard Users */}
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Standard Users</CardTitle>
              </div>
              <Button size="sm" onClick={() => setShowAddUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            <CardDescription>Users who sign in with email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {userProfiles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><UserIcon className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="font-medium">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={user.is_active ? 'outline' : 'destructive'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(user.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setShowChangePassword(true); }} title="Change password"><Key className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser({ ...user }); setShowEditUser(true); }} title="Edit user"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user)} disabled={user.id === currentUser?.id} title="Delete user"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {userProfiles.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No standard users found</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approved Google Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Approved Google Accounts</CardTitle>
                  <CardDescription>Gmail IDs allowed to sign in with Google</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddGoogleUser(true)}><Plus className="h-4 w-4 mr-2" />Add Email</Button>
            </div>
          </CardHeader>
          <CardContent>
             <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">A Google Cloud Project is Required</p>
                  <p className="mt-1">To enable Google Sign-In, you must configure OAuth credentials in your Google Cloud project and add the keys to your Supabase settings.</p>
                </div>
              </div>
            </div>
            {approvedGoogleUsers.length > 0 ? (
              <div className="space-y-2">
                {approvedGoogleUsers.map((gUser) => (
                  <div key={gUser.email} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100"><UserCheck className="h-4 w-4 text-green-600" /></div>
                      <div><p className="font-medium">{gUser.email}</p><p className="text-xs text-muted-foreground">Added {format(new Date(gUser.created_at), 'dd MMM yyyy')}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={gUser.role === 'admin' ? 'default' : 'secondary'}>{gUser.role}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveGoogleUser(gUser.email)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-center text-muted-foreground py-8">No approved Google accounts.</p>)}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle><DialogDescription>Create a new local user account</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Display Name *</Label><Input placeholder="John Doe" value={newUser.displayName} onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password *</Label><Input type="password" placeholder="Minimum 6 characters" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button><Button onClick={handleAddUser} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create User</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update user information</DialogDescription></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Display Name</Label><Input value={selectedUser.display_name ?? ''} onChange={(e) => setSelectedUser({ ...selectedUser, display_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={selectedUser.role ?? 'staff'} onValueChange={(value: UserRole) => setSelectedUser({ ...selectedUser, role: value })} disabled={selectedUser.id === currentUser?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>Active Status</Label><p className="text-sm text-muted-foreground">Allow this user to log in</p></div>
                <Switch checked={selectedUser.is_active} onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_active: checked })} disabled={selectedUser.id === currentUser?.id} />
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowEditUser(false)}>Cancel</Button><Button onClick={handleUpdateUser} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Password</DialogTitle><DialogDescription>Set a new password for {selectedUser?.display_name}</DialogDescription></DialogHeader>
          <div className="py-4">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Minimum 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button><Button onClick={handleChangePassword} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Change Password</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Approved Google User Dialog */}
      <Dialog open={showAddGoogleUser} onOpenChange={setShowAddGoogleUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Approved Google Account</DialogTitle><DialogDescription>Allow a Gmail address to sign in with Google</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Gmail Address *</Label><Input type="email" placeholder="user@gmail.com" value={newGoogleEmail} onChange={(e) => setNewGoogleEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={newGoogleRole} onValueChange={(value: UserRole) => setNewGoogleRole(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddGoogleUser(false)}>Cancel</Button><Button onClick={handleAddGoogleUser} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Email</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
