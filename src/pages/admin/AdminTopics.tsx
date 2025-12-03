import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  interest_area_keywords: string[] | null;
  recommended_roles: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  model_cat_count?: number;
  vendor_cat_count?: number;
}

export default function AdminTopics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data: topicsData, error } = await supabase
          .from('topics')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Get counts for each topic
        const topicsWithCounts = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const [modelCats, vendorCats] = await Promise.all([
              supabase.from('topic_model_categories').select('id', { count: 'exact' }).eq('topic_id', topic.id),
              supabase.from('topic_vendor_categories').select('id', { count: 'exact' }).eq('topic_id', topic.id),
            ]);

            return {
              ...topic,
              model_cat_count: modelCats.count || 0,
              vendor_cat_count: vendorCats.count || 0,
            };
          })
        );

        setTopics(topicsWithCounts);
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const columns: Column<Topic>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'interest_area_keywords',
      header: 'Keywords',
      render: (topic) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(topic.interest_area_keywords || []).slice(0, 3).map((k) => (
            <Badge key={k} variant="outline" className="text-xs">
              {k}
            </Badge>
          ))}
          {(topic.interest_area_keywords || []).length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{(topic.interest_area_keywords || []).length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'model_cat_count',
      header: 'Model Categories',
      sortable: true,
      render: (topic) => topic.model_cat_count || 0,
    },
    {
      key: 'vendor_cat_count',
      header: 'Vendor Categories',
      sortable: true,
      render: (topic) => topic.vendor_cat_count || 0,
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (topic) => (
        <Badge variant={topic.active ? 'default' : 'secondary'}>
          {topic.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (topic) => new Date(topic.updated_at).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Topics</h1>
            <p className="text-muted-foreground">Manage recommendation topics that connect users to content via categories</p>
          </div>
          <Button onClick={() => navigate('/admin/topics/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Topic
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading topics...</p>
        ) : (
          <DataTable
            data={topics}
            columns={columns}
            searchPlaceholder="Search topics..."
            searchKeys={['name', 'description']}
            onRowClick={(topic) => navigate(`/admin/topics/${topic.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
