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
import { Plus } from 'lucide-react';

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
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let query = supabase.from('profiles').select('*');

        if (roleFilter !== 'all') {
          query = query.eq('role_title', roleFilter);
        }
        if (regionFilter !== 'all') {
          query = query.eq('firm_region', regionFilter);
        }

        const { data: profiles, error } = await query;

        if (error) throw error;

        // Check admin status for each user
        const usersWithAdminStatus = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { data: isAdmin } = await supabase.rpc('has_role', {
              _user_id: profile.user_id,
              _role: 'admin',
            });
            return { ...profile, is_admin: isAdmin === true };
          })
        );

        setUsers(usersWithAdminStatus);
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
      key: 'role_title',
      header: 'Role',
      sortable: true,
      render: (user) => user.role_title || '-',
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage users and access control</p>
          </div>
          <Button onClick={() => navigate('/admin/users/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

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
