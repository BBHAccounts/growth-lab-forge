import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  featured: boolean;
  author: string | null;
  created_at: string;
  updated_at: string;
}

const typeColors: Record<string, string> = {
  article: 'bg-blue-100 text-blue-800',
  webinar: 'bg-purple-100 text-purple-800',
  guide: 'bg-green-100 text-green-800',
  video: 'bg-red-100 text-red-800',
  podcast: 'bg-orange-100 text-orange-800',
};

export default function AdminResources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const columns: Column<Resource>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (resource) => (
        <Badge className={typeColors[resource.type] || 'bg-gray-100 text-gray-800'}>
          {resource.type}
        </Badge>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (resource) => resource.author || '-',
    },
    {
      key: 'featured',
      header: 'Featured',
      sortable: true,
      render: (resource) => (
        <Badge variant={resource.featured ? 'default' : 'outline'}>
          {resource.featured ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (resource) => (
        <Badge variant={resource.status === 'active' ? 'default' : 'secondary'}>
          {resource.status}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (resource) => new Date(resource.updated_at).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Insights Hub</h1>
            <p className="text-muted-foreground">Manage articles, webinars, guides, and other insights</p>
          </div>
          <Button onClick={() => navigate('/admin/insights-hub/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Insight
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading insights...</p>
        ) : (
          <DataTable
            data={resources}
            columns={columns}
            searchPlaceholder="Search insights..."
            searchKeys={['title', 'description', 'author']}
            onRowClick={(resource) => navigate(`/admin/insights-hub/${resource.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
