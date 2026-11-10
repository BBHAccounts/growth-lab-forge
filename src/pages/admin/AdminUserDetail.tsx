import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isLibraryModel } from '@/lib/model-library';
import { ArrowLeft, Save, Shield, FlaskConical, Trash2, Send, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role_title: string | null;
  firm_name: string | null;
  firm_region: string | null;
  firm_size: string | null;
  firm_type: string | null;
  practice_area: string | null;
  growth_priorities: string[] | null;
  interest_areas: string[] | null;
  research_contributor: boolean | null;
  game_of_life_access: boolean | null;
  is_client: boolean | null;
  data_maturity_level: number | null;
  growth_maturity_level: number | null;
  international_scope: boolean | null;
}

interface UserAuthInfo {
  status: 'active' | 'invited' | 'unconfirmed';
  last_sign_in_at: string | null;
  created_at: string | null;
  email_confirmed_at: string | null;
}

interface ActivatedModel {
  id: string;
  model_id: string;
  current_step: number;
  completed: boolean;
  updated_at: string;
  model_name?: string;
}

interface Topic {
  id: string;
  name: string;
  category_key: string | null;
  isAutomatic: boolean;
}

interface ResearchContribution {
  id: string;
  study_id: string;
  study_title: string;
  completed: boolean;
  created_at: string;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authInfo, setAuthInfo] = useState<UserAuthInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingAdminChange, setPendingAdminChange] = useState<boolean | null>(null);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [activatedModels, setActivatedModels] = useState<ActivatedModel[]>([]);
  const [linkedTopics, setLinkedTopics] = useState<Topic[]>([]);
  const [researchContributions, setResearchContributions] = useState<ResearchContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Check admin status
        const { data: adminStatus } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });
        setIsAdmin(adminStatus === true);

        // Fetch auth info
        const { data: authData } = await supabase.functions.invoke('get-users-auth-info');
        if (authData?.users) {
          const userAuth = authData.users.find((u: any) => u.user_id === userId);
          if (userAuth) {
            let status: 'active' | 'invited' | 'unconfirmed' = 'unconfirmed';
            if (userAuth.last_sign_in_at) status = 'active';
            else if (userAuth.invited_at && !userAuth.email_confirmed_at) status = 'invited';
            else if (userAuth.email_confirmed_at) status = 'active';
            
            setAuthInfo({
              status,
              last_sign_in_at: userAuth.last_sign_in_at,
              created_at: userAuth.created_at,
              email_confirmed_at: userAuth.email_confirmed_at,
            });
          }
        }

        // Fetch activated models
        const { data: modelsData } = await supabase
          .from('activated_models')
          .select('id, model_id, current_step, completed, updated_at, models!inner(name, tags, status)')
          .eq('user_id', userId);

        const models = (modelsData || []).filter(m => m.models && isLibraryModel(m.models)).map((m) => ({
          ...m,
          model_name: (m.models as { name: string } | null)?.name || 'Unknown',
        }));
        setActivatedModels(models);

      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, toast]);

  const handleAdminToggle = (checked: boolean) => {
    setPendingAdminChange(checked);
    setShowAdminConfirm(true);
  };

  const confirmAdminChange = () => {
    if (pendingAdminChange !== null) {
      setIsAdmin(pendingAdminChange);
    }
    setShowAdminConfirm(false);
    setPendingAdminChange(null);
  };

  const cancelAdminChange = () => {
    setShowAdminConfirm(false);
    setPendingAdminChange(null);
  };

  const handleSave = async () => {
    if (!profile || !userId) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          role_title: profile.role_title,
          firm_name: profile.firm_name,
          firm_region: profile.firm_region,
          firm_size: profile.firm_size,
          practice_area: profile.practice_area,
          research_contributor: profile.research_contributor,
          game_of_life_access: profile.game_of_life_access,
          is_client: profile.is_client,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update admin role
      const { data: currentAdminStatus } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (isAdmin && !currentAdminStatus) {
        // Add admin role
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'admin',
        });
      } else if (!isAdmin && currentAdminStatus) {
        // Remove admin role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvite = async () => {
    if (!profile?.email || !userId) return;

    setResendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: profile.email,
          full_name: profile.full_name,
          user_id: userId,
          redirect_url: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invite Sent',
        description: `A new invitation email has been sent to ${profile.email}`,
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invite',
        variant: 'destructive',
      });
    } finally {
      setResendingInvite(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      navigate('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading...</p>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">User not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.full_name || 'Unnamed User'}</h1>
              {authInfo && (
                <Badge 
                  variant={authInfo.status === 'active' ? 'default' : authInfo.status === 'invited' ? 'secondary' : 'outline'}
                >
                  {authInfo.status === 'active' ? 'Active' : authInfo.status === 'invited' ? 'Invited' : 'Unconfirmed'}
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </Badge>
              )}

            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{profile.email}</span>
              {authInfo?.last_sign_in_at && (
                <span className="text-sm" title={format(new Date(authInfo.last_sign_in_at), 'PPpp')}>
                  Last login: {formatDistanceToNow(new Date(authInfo.last_sign_in_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          {authInfo?.status !== 'active' && (
            <Button
              variant="outline"
              onClick={handleResendInvite}
              disabled={resendingInvite}
            >
              {resendingInvite ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {resendingInvite ? 'Sending...' : 'Resend Invite'}
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={profile.role_title || ''}
                  onValueChange={(value) => setProfile({ ...profile, role_title: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Lawyer">Lawyer</SelectItem>
                    <SelectItem value="MBD">MBD</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Firm Name</Label>
                <Input
                  value={profile.firm_name || ''}
                  onChange={(e) => setProfile({ ...profile, firm_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select
                  value={profile.firm_region || ''}
                  onValueChange={(value) => setProfile({ ...profile, firm_region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                    <SelectItem value="Middle East">Middle East</SelectItem>
                    <SelectItem value="Latin America">Latin America</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Firm Size</Label>
                <Select
                  value={profile.firm_size || ''}
                  onValueChange={(value) => setProfile({ ...profile, firm_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Practice Area</Label>
                <Input
                  value={profile.practice_area || ''}
                  onChange={(e) => setProfile({ ...profile, practice_area: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Admin</Label>
                  <p className="text-sm text-muted-foreground">Full admin access to the platform</p>
                </div>
                <Switch checked={isAdmin} onCheckedChange={handleAdminToggle} />
              </div>

            </CardContent>
          </Card>

          {/* Tool progress */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tool progress</CardTitle>
            </CardHeader>
            <CardContent>
              {activatedModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No models activated</p>
              ) : (
                <div className="space-y-2">
                  {activatedModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{model.model_name}</span>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Step {model.current_step}</span>
                        <Badge variant={model.completed ? 'default' : 'secondary'}>
                          {model.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                        <span>{new Date(model.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/users')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Confirmation Dialog */}
      <ConfirmDialog
        open={showAdminConfirm}
        onOpenChange={setShowAdminConfirm}
        title={pendingAdminChange ? 'Grant Admin Access' : 'Remove Admin Access'}
        description={
          pendingAdminChange
            ? `Are you sure you want to grant admin access to ${profile.full_name || profile.email}? This will give them full control over the platform.`
            : `Are you sure you want to remove admin access from ${profile.full_name || profile.email}?`
        }
        confirmLabel={pendingAdminChange ? 'Grant Admin' : 'Remove Admin'}
        onConfirm={confirmAdminChange}
        variant={pendingAdminChange ? 'default' : 'destructive'}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${profile.full_name || profile.email}? This action cannot be undone and will remove all their data.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete User'}
        onConfirm={handleDeleteUser}
        variant="destructive"
      />
    </AdminLayout>
  );
}
