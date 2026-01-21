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

interface Program {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  model_name?: string;
  participant_count?: number;
  submitted_count?: number;
}

export default function AdminPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        let query = supabase
          .from('programs')
          .select(`
            *,
            models (name)
          `)
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Get participant counts
        const programsWithCounts = await Promise.all(
          (data || []).map(async (program) => {
            const { count: participantCount } = await supabase
              .from('program_participants')
              .select('*', { count: 'exact', head: true })
              .eq('program_id', program.id);

            const { count: submittedCount } = await supabase
              .from('program_participants')
              .select('*', { count: 'exact', head: true })
              .eq('program_id', program.id)
              .eq('status', 'submitted');

            return {
              ...program,
              model_name: (program.models as { name: string } | null)?.name || 'No model linked',
              participant_count: participantCount || 0,
              submitted_count: submittedCount || 0,
            };
          })
        );

        setPrograms(programsWithCounts);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [statusFilter]);

  const columns: Column<Program>[] = [
    {
      key: 'name',
      header: 'Program Name',
      sortable: true,
    },
    {
      key: 'model_name',
      header: 'Linked Model',
      render: (program) => program.model_name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (program) => {
        const variant = program.status === 'active' ? 'default' : program.status === 'closed' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{program.status}</Badge>;
      },
    },
    {
      key: 'participant_count',
      header: 'Participants',
      sortable: true,
      render: (program) => (
        <span>
          {program.submitted_count} / {program.participant_count} submitted
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true,
      render: (program) => program.deadline ? new Date(program.deadline).toLocaleDateString() : '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (program) => new Date(program.created_at).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Programs</h1>
            <p className="text-muted-foreground">Manage assignments and pre-work for participants</p>
          </div>
          <Button onClick={() => navigate('/admin/programs/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Program
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading programs...</p>
        ) : (
          <DataTable
            data={programs}
            columns={columns}
            searchPlaceholder="Search programs..."
            searchKeys={['name', 'description']}
            onRowClick={(program) => navigate(`/admin/programs/${program.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
