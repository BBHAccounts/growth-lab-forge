import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface UserAuthInfo {
  user_id: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  invited_at: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role_title: string | null;
  firm_name: string | null;
  firm_region: string | null;
  firm_size: string | null;
  research_contributor: boolean | null;
  game_of_life_access: boolean | null;
  is_client: boolean | null;
  is_admin?: boolean;
  // Auth info
  status?: 'active' | 'invited' | 'unconfirmed';
  last_sign_in_at?: string | null;
}

function getUserStatus(authInfo: UserAuthInfo | undefined): 'active' | 'invited' | 'unconfirmed' {
  if (!authInfo) return 'unconfirmed';
  if (authInfo.last_sign_in_at) return 'active';
  if (authInfo.invited_at && !authInfo.email_confirmed_at) return 'invited';
  if (authInfo.email_confirmed_at) return 'active';
  return 'unconfirmed';
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingPasswords, setSettingPasswords] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const handleSetPasswords = async () => {
    if (!confirm('Are you sure you want to set the default password for all @beyondbillablehours.io users?')) {
      return;
    }
    
    setSettingPasswords(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-user-passwords');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Passwords Updated',
        description: data.message,
      });
    } catch (error) {
      console.error('Error setting passwords:', error);
      toast({
        title: 'Error',
        description: 'Failed to set passwords',
        variant: 'destructive',
      });
    } finally {
      setSettingPasswords(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch profiles
        let query = supabase.from('profiles').select('*');

        if (roleFilter !== 'all') {
          query = query.eq('role_title', roleFilter);
        }
        if (regionFilter !== 'all') {
          query = query.eq('firm_region', regionFilter);
        }

        const { data: profiles, error } = await query;

        if (error) throw error;

        // Fetch auth info for all users
        const { data: authData, error: authError } = await supabase.functions.invoke('get-users-auth-info');
        
        const authInfoMap = new Map<string, UserAuthInfo>();
        if (!authError && authData?.users) {
          authData.users.forEach((info: UserAuthInfo) => {
            authInfoMap.set(info.user_id, info);
          });
        }

        // Check admin status for each user and merge auth info
        const usersWithStatus = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { data: isAdmin } = await supabase.rpc('has_role', {
              _user_id: profile.user_id,
              _role: 'admin',
            });
            
            const authInfo = authInfoMap.get(profile.user_id);
            
            return { 
              ...profile, 
              is_admin: isAdmin === true,
              status: getUserStatus(authInfo),
              last_sign_in_at: authInfo?.last_sign_in_at || null,
            };
          })
        );

        setUsers(usersWithStatus);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter, regionFilter]);

  const columns: Column<UserProfile>[] = [
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      render: (user) => user.full_name || 'No name',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => {
        const statusConfig = {
          active: { label: 'Active', variant: 'default' as const },
          invited: { label: 'Invited', variant: 'secondary' as const },
          unconfirmed: { label: 'Unconfirmed', variant: 'outline' as const },
        };
        const config = statusConfig[user.status || 'unconfirmed'];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'last_sign_in_at',
      header: 'Last Login',
      sortable: true,
      render: (user) => {
        if (!user.last_sign_in_at) return <span className="text-muted-foreground">Never</span>;
        const date = new Date(user.last_sign_in_at);
        return (
          <span title={format(date, 'PPpp')}>
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      key: 'firm_name',
      header: 'Firm',
      sortable: true,
      render: (user) => user.firm_name || '-',
    },
    {
      key: 'firm_region',
      header: 'Region',
      sortable: true,
      render: (user) => user.firm_region || '-',
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.is_admin && <Badge variant="secondary">Admin</Badge>}
          {user.is_client && <Badge variant="outline">Client</Badge>}
          {user.research_contributor && <Badge variant="outline">Research</Badge>}
          {user.game_of_life_access && <Badge variant="outline">GoL</Badge>}
        </div>
      ),
    },
  ];

  // New users = those without a full_name (haven't completed onboarding) or created in last 7 days with no login
  const newUsers = users.filter(u => 
    !u.full_name || u.full_name.trim() === '' || u.status === 'unconfirmed'
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage users and access control</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSetPasswords}
              disabled={settingPasswords}
            >
              <Key className="w-4 h-4 mr-2" />
              {settingPasswords ? 'Setting...' : 'Set BBH Passwords'}
            </Button>
            <Button onClick={() => navigate('/admin/users/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* New Users Queue */}
        {!loading && newUsers.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <span className="text-lg">👋</span>
              </div>
              <div>
                <h3 className="font-semibold">New Users ({newUsers.length})</h3>
                <p className="text-xs text-muted-foreground">Users who haven't completed their profile yet</p>
              </div>
            </div>
            <div className="grid gap-2">
              {newUsers.slice(0, 5).map(user => (
                <button
                  key={user.id}
                  onClick={() => navigate(`/admin/users/${user.user_id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name || user.email || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={user.status === 'unconfirmed' ? 'outline' : 'secondary'}>
                      {!user.full_name || user.full_name.trim() === '' ? 'No profile' : user.status}
                    </Badge>
                  </div>
                </button>
              ))}
              {newUsers.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{newUsers.length - 5} more new users
                </p>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
              <SelectItem value="Lawyer">Lawyer</SelectItem>
              <SelectItem value="MBD">MBD</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="North America">North America</SelectItem>
              <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
              <SelectItem value="Middle East">Middle East</SelectItem>
              <SelectItem value="Latin America">Latin America</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : (
          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Search users..."
            searchKeys={['full_name', 'email', 'firm_name']}
            onRowClick={(user) => navigate(`/admin/users/${user.user_id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
