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
import { Plus, FileDown } from 'lucide-react';

interface Study {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  active: boolean | null;
  estimated_time: number | null;
  reward_description: string | null;
  created_at: string;
  response_count?: number;
}

export default function AdminResearch() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        let query = supabase.from('research_studies').select('*').order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          if (statusFilter === 'active') {
            query = query.eq('active', true);
          } else if (statusFilter === 'inactive') {
            query = query.eq('active', false);
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Get response counts
        const studiesWithCounts = await Promise.all(
          (data || []).map(async (study) => {
            const { count } = await supabase
              .from('research_responses')
              .select('*', { count: 'exact', head: true })
              .eq('study_id', study.id);
            return { ...study, response_count: count || 0 };
          })
        );

        setStudies(studiesWithCounts);
      } catch (error) {
        console.error('Error fetching studies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [statusFilter]);

  const columns: Column<Study>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (study) => {
        const isActive = study.active;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'response_count',
      header: 'Responses',
      sortable: true,
      render: (study) => study.response_count || 0,
    },
    {
      key: 'reward_description',
      header: 'Reward',
      render: (study) => study.reward_description || '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (study) => new Date(study.created_at).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Research Lab</h1>
            <p className="text-muted-foreground">Manage research studies and questionnaires</p>
          </div>
          <Button onClick={() => navigate('/admin/research/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Study
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
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading studies...</p>
        ) : (
          <DataTable
            data={studies}
            columns={columns}
            searchPlaceholder="Search studies..."
            searchKeys={['title', 'description']}
            onRowClick={(study) => navigate(`/admin/research/${study.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
