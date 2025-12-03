import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface Resource {
  id?: string;
  title: string;
  description: string;
  type: string;
  url: string;
  emoji: string;
  image_url: string;
  author: string;
  published_date: string;
  estimated_time: number | null;
  status: string;
  featured: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  linked: boolean;
}

const defaultResource: Resource = {
  title: '',
  description: '',
  type: 'article',
  url: '',
  emoji: '📄',
  image_url: '',
  author: '',
  published_date: '',
  estimated_time: null,
  status: 'active',
  featured: false,
};

const RESOURCE_TYPES = [
  { value: 'article', label: 'Article', emoji: '📄' },
  { value: 'webinar', label: 'Webinar', emoji: '🎥' },
  { value: 'guide', label: 'Guide', emoji: '📘' },
  { value: 'video', label: 'Video', emoji: '▶️' },
  { value: 'podcast', label: 'Podcast', emoji: '🎙️' },
];

export default function AdminResourceForm() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = resourceId === 'new';

  const [resource, setResource] = useState<Resource>(defaultResource);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all resource categories
      const { data: catsData } = await supabase
        .from('resource_categories')
        .select('id, name')
        .order('name');

      if (!isNew && resourceId) {
        const { data: resourceData, error } = await supabase
          .from('resources')
          .select('*')
          .eq('id', resourceId)
          .single();

        if (error) {
          console.error('Error fetching resource:', error);
          toast({ title: 'Error', description: 'Failed to load insight', variant: 'destructive' });
          return;
        }

        setResource({
          ...defaultResource,
          ...resourceData,
          published_date: resourceData.published_date || '',
        });

        // Fetch linked categories
        const { data: linkedCats } = await supabase
          .from('resource_category_links')
          .select('category_id')
          .eq('resource_id', resourceId);

        const linkedCatIds = new Set((linkedCats || []).map((l) => l.category_id));
        setCategories((catsData || []).map((c) => ({ id: c.id, name: c.name, linked: linkedCatIds.has(c.id) })));
      } else {
        setCategories((catsData || []).map((c) => ({ id: c.id, name: c.name, linked: false })));
      }

      setLoading(false);
    };

    fetchData();
  }, [resourceId, isNew, toast]);

  const handleSave = async () => {
    if (!resource.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let savedResourceId = resourceId;

      const resourceData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        url: resource.url || null,
        emoji: resource.emoji,
        image_url: resource.image_url || null,
        author: resource.author || null,
        published_date: resource.published_date || null,
        estimated_time: resource.estimated_time,
        status: resource.status,
        featured: resource.featured,
      };

      if (isNew) {
        const { data, error } = await supabase.from('resources').insert([resourceData]).select('id').single();
        if (error) throw error;
        savedResourceId = data.id;
      } else {
        const { error } = await supabase.from('resources').update(resourceData).eq('id', resourceId);
        if (error) throw error;
      }

      // Update linked categories
      await supabase.from('resource_category_links').delete().eq('resource_id', savedResourceId);
      const linkedCatIds = categories.filter((c) => c.linked).map((c) => ({ resource_id: savedResourceId, category_id: c.id }));
      if (linkedCatIds.length > 0) {
        await supabase.from('resource_category_links').insert(linkedCatIds);
      }

      toast({ title: 'Success', description: isNew ? 'Insight created successfully' : 'Insight updated successfully' });
      navigate('/admin/insights-hub');
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({ title: 'Error', description: 'Failed to save insight', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !resourceId) return;

    try {
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Insight deleted successfully' });
      navigate('/admin/insights-hub');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({ title: 'Error', description: 'Failed to delete insight', variant: 'destructive' });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, linked: !c.linked } : c))
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/insights-hub')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Add Insight' : 'Edit Insight'}</h1>
              <p className="text-muted-foreground">{isNew ? 'Create a new insight' : resource.title}</p>
            </div>
          </div>
          {!isNew && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={resource.title}
                  onChange={(e) => setResource({ ...resource, title: e.target.value })}
                  placeholder="Insight title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={resource.description}
                  onChange={(e) => setResource({ ...resource, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={resource.type}
                    onValueChange={(value) => {
                      const typeData = RESOURCE_TYPES.find((t) => t.value === value);
                      setResource({ ...resource, type: value, emoji: typeData?.emoji || '📄' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <Input
                    value={resource.emoji}
                    onChange={(e) => setResource({ ...resource, emoji: e.target.value })}
                    placeholder="📄"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={resource.url}
                  onChange={(e) => setResource({ ...resource, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={resource.image_url}
                  onChange={(e) => setResource({ ...resource, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={resource.author}
                  onChange={(e) => setResource({ ...resource, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Published Date</Label>
                  <Input
                    type="date"
                    value={resource.published_date}
                    onChange={(e) => setResource({ ...resource, published_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Time (mins)</Label>
                  <Input
                    type="number"
                    value={resource.estimated_time || ''}
                    onChange={(e) => setResource({ ...resource, estimated_time: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={resource.status}
                  onValueChange={(value) => setResource({ ...resource, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured</Label>
                  <p className="text-sm text-muted-foreground">Highlight this insight</p>
                </div>
                <Switch
                  checked={resource.featured}
                  onCheckedChange={(checked) => setResource({ ...resource, featured: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={cat.linked}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insight categories defined yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/insights-hub')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Insight'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Insight"
        description="Are you sure you want to delete this insight? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </AdminLayout>
  );
}
