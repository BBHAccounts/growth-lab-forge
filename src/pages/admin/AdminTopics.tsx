import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface TopicCategory {
  key: string;
  name: string;
}

interface Topic {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  category_key: string | null;
  order_index: number | null;
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
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch topic categories first
        const { data: categoriesData } = await supabase
          .from('topic_categories')
          .select('key, name')
          .order('order_index');

        setTopicCategories(categoriesData || []);

        // Build topics query
        let query = supabase.from('topics').select('*');
        
        if (categoryFilter && categoryFilter !== 'all') {
          query = query.eq('category_key', categoryFilter);
        }

        const { data: topicsData, error } = await query.order('order_index', { ascending: true });

        if (error) throw error;

        // Get counts for each topic
        const topicsWithCounts = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const [modelCats, vendorCats] = await Promise.all([
              supabase.from('topic_model_categories').select('*', { count: 'exact', head: true }).eq('topic_id', topic.id),
              supabase.from('topic_vendor_categories').select('*', { count: 'exact', head: true }).eq('topic_id', topic.id),
            ]);

            return {
              ...topic,
              model_cat_count: modelCats.count ?? 0,
              vendor_cat_count: vendorCats.count ?? 0,
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

    fetchData();
  }, [categoryFilter]);

  const getCategoryName = (categoryKey: string | null) => {
    if (!categoryKey) return '-';
    const cat = topicCategories.find(c => c.key === categoryKey);
    return cat?.name || categoryKey;
  };

  const columns: Column<Topic>[] = [
    {
      key: 'order_index',
      header: '#',
      sortable: true,
      render: (topic) => topic.order_index || '-',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'category_key',
      header: 'Category',
      sortable: true,
      render: (topic) => (
        <Badge variant="outline" className="text-xs">
          {getCategoryName(topic.category_key)}
        </Badge>
      ),
    },
    {
      key: 'interest_area_keywords',
      header: 'Keywords',
      render: (topic) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(topic.interest_area_keywords || []).slice(0, 3).map((k) => (
            <Badge key={k} variant="secondary" className="text-xs">
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
      header: 'Model Cats',
      sortable: true,
      render: (topic) => topic.model_cat_count || 0,
    },
    {
      key: 'vendor_cat_count',
      header: 'Vendor Cats',
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

        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {topicCategories.map((cat) => (
                <SelectItem key={cat.key} value={cat.key}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading topics...</p>
        ) : (
          <DataTable
            data={topics}
            columns={columns}
            searchPlaceholder="Search topics..."
            searchKeys={['name', 'description', 'key']}
            onRowClick={(topic) => navigate(`/admin/topics/${topic.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
