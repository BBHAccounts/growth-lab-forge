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

interface Model {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  audience: string[] | null;
  tags: string[] | null;
  unlock_level: string | null;
  status: string | null;
  updated_at: string;
  emoji: string | null;
}

export default function AdminModels() {
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unlockFilter, setUnlockFilter] = useState<string>('all');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        let query = supabase.from('models').select('*').order('updated_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        if (unlockFilter !== 'all') {
          query = query.eq('unlock_level', unlockFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setModels(data || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [statusFilter, unlockFilter]);

  const columns: Column<Model>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (model) => (
        <div className="flex items-center gap-2">
          <span>{model.emoji || '📚'}</span>
          <span>{model.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (model) => model.slug || '-',
    },
    {
      key: 'audience',
      header: 'Audience',
      render: (model) => (
        <div className="flex flex-wrap gap-1">
          {(model.audience || []).map((a) => (
            <Badge key={a} variant="outline" className="text-xs">
              {a}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'unlock_level',
      header: 'Unlock Level',
      sortable: true,
      render: (model) => (
        <Badge variant="secondary">{model.unlock_level || 'registered'}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (model) => {
        const status = model.status || 'active';
        const variant = status === 'active' ? 'default' : status === 'draft' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (model) => new Date(model.updated_at).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Models</h1>
            <p className="text-muted-foreground">Manage toolbox models</p>
          </div>
          <Button onClick={() => navigate('/admin/models/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Model
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unlockFilter} onValueChange={setUnlockFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by unlock level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="research_contributor">Research Contributor</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading models...</p>
        ) : (
          <DataTable
            data={models}
            columns={columns}
            searchPlaceholder="Search models..."
            searchKeys={['name', 'slug', 'short_description']}
            onRowClick={(model) => navigate(`/admin/models/${model.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
