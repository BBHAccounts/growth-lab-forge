import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role_title: string | null;
  firm_name: string | null;
  firm_region: string | null;
  firm_size: string | null;
  practice_area: string | null;
  growth_priorities: string[] | null;
  research_contributor: boolean | null;
  game_of_life_access: boolean | null;
  is_client: boolean | null;
}

interface ActivatedModel {
  id: string;
  model_id: string;
  current_step: number;
  completed: boolean;
  updated_at: string;
  model_name?: string;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activatedModels, setActivatedModels] = useState<ActivatedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

        // Fetch activated models
        const { data: modelsData } = await supabase
          .from('activated_models')
          .select('*, models(name)')
          .eq('user_id', userId);

        const models = (modelsData || []).map((m) => ({
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
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || 'Unnamed User'}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
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
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Admin</Label>
                  <p className="text-sm text-muted-foreground">Full admin access</p>
                </div>
                <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Client</Label>
                  <p className="text-sm text-muted-foreground">BBH client status</p>
                </div>
                <Switch
                  checked={profile.is_client || false}
                  onCheckedChange={(checked) => setProfile({ ...profile, is_client: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Research Contributor</Label>
                  <p className="text-sm text-muted-foreground">Has Research Contributor badge</p>
                </div>
                <Switch
                  checked={profile.research_contributor || false}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, research_contributor: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Activated Models */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Activated Models</CardTitle>
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
                        <span>{model.completed ? 'Completed' : 'In Progress'}</span>
                        <span>{new Date(model.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
