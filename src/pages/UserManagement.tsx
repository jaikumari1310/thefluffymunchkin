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
import {
  User as UserType,
  UserRole,
  ApprovedGoogleUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  getApprovedGoogleUsers,
  addApprovedGoogleUser,
  removeApprovedGoogleUser,
} from '@/lib/auth-db';
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

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [approvedGoogleUsers, setApprovedGoogleUsers] = useState<ApprovedGoogleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddGoogleUser, setShowAddGoogleUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    displayName: '',
    email: '',
    role: 'staff' as UserRole,
  });
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
      const [usersData, googleUsersData] = await Promise.all([
        getUsers(),
        getApprovedGoogleUsers(),
      ]);
      setUsers(usersData);
      setApprovedGoogleUsers(googleUsersData);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.displayName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        username: newUser.username.trim(),
        password: newUser.password,
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim() || undefined,
        role: newUser.role,
      });
      toast.success('User created successfully');
      setShowAddUser(false);
      setNewUser({ username: '', password: '', displayName: '', email: '', role: 'staff' });
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
      await updateUser(selectedUser.id, {
        displayName: selectedUser.displayName,
        email: selectedUser.email,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      });
      toast.success('User updated successfully');
      setShowEditUser(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update user');
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

    setIsSubmitting(true);
    try {
      await updateUserPassword(selectedUser.id, newPassword);
      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAddGoogleUser = async () => {
    const email = newGoogleEmail.trim().toLowerCase();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await addApprovedGoogleUser(email, newGoogleRole);
      toast.success('Approved Google user added');
      setShowAddGoogleUser(false);
      setNewGoogleEmail('');
      setNewGoogleRole('staff');
      loadData();
    } catch (error) {
      toast.error('Failed to add approved Google user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGoogleUser = async (email: string) => {
    if (!confirm(`Remove ${email} from approved list?`)) return;

    try {
      await removeApprovedGoogleUser(email);
      toast.success('Removed from approved list');
      loadData();
    } catch (error) {
      toast.error('Failed to remove approved user');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
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
          <Button onClick={() => setShowAddUser(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Local Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Local Users</CardTitle>
            </div>
            <CardDescription>Users with username and password login</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(u => u.authProvider === 'local').map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">@{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowChangePassword(true);
                          }}
                          title="Change password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser({ ...user });
                            setShowEditUser(true);
                          }}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUser?.id}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.filter(u => u.authProvider === 'local').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No local users found
                    </TableCell>
                  </TableRow>
                )}
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
              <Button variant="outline" size="sm" onClick={() => setShowAddGoogleUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Google Sign-In Not Configured</p>
                  <p className="mt-1">Google OAuth requires cloud integration. These approved emails will be used when Google Sign-In is enabled.</p>
                </div>
              </div>
            </div>
            
            {approvedGoogleUsers.length > 0 ? (
              <div className="space-y-2">
                {approvedGoogleUsers.map((gUser) => (
                  <div
                    key={gUser.email}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{gUser.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(gUser.createdAt), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={gUser.role === 'admin' ? 'default' : 'secondary'}>
                        {gUser.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGoogleUser(gUser.email)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No approved Google accounts. Add emails to allow Google Sign-In.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new local user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                placeholder="John Doe"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                placeholder="johndoe"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={selectedUser.displayName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: UserRole) => setSelectedUser({ ...selectedUser, role: value })}
                  disabled={selectedUser.id === currentUser?.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">Allow this user to log in</p>
                </div>
                <Switch
                  checked={selectedUser.isActive}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isActive: checked })}
                  disabled={selectedUser.id === currentUser?.id}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Approved Google User Dialog */}
      <Dialog open={showAddGoogleUser} onOpenChange={setShowAddGoogleUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approved Google Account</DialogTitle>
            <DialogDescription>
              Allow a Gmail address to sign in with Google
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gmail Address *</Label>
              <Input
                type="email"
                placeholder="user@gmail.com"
                value={newGoogleEmail}
                onChange={(e) => setNewGoogleEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newGoogleRole}
                onValueChange={(value: UserRole) => setNewGoogleRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoogleUser(false)}>Cancel</Button>
            <Button onClick={handleAddGoogleUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
