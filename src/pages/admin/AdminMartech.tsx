import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface TopicCategory {
  id: string;
  key: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  category_key: string | null;
}

interface Vendor {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  regions: string[] | null;
  firm_sizes: string[] | null;
  likes_count: number | null;
  categories?: string[];
}

export default function AdminMartech() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<Category | null>(null);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingCategory, setLinkingCategory] = useState<Category | null>(null);
  const [linkedTopicCategories, setLinkedTopicCategories] = useState<string[]>([]);
  const [linkedTopics, setLinkedTopics] = useState<string[]>([]);
  const [savingLinks, setSavingLinks] = useState(false);

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const fetchData = async () => {
    try {
      // Fetch categories, topic categories, and topics in parallel
      const [categoriesRes, topicCatsRes, topicsRes] = await Promise.all([
        supabase.from('martech_categories').select('*').order('name'),
        supabase.from('topic_categories').select('id, key, name').order('order_index'),
        supabase.from('topics').select('id, name, category_key').eq('active', true).order('order_index'),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      setCategories(categoriesRes.data || []);
      setTopicCategories(topicCatsRes.data || []);
      setTopics(topicsRes.data || []);

      // Fetch vendors with their categories
      let vendorsQuery = supabase.from('vendors').select('*').order('name');
      const { data: vendorsData, error: vendorsError } = await vendorsQuery;

      if (vendorsError) throw vendorsError;

      // Fetch vendor categories
      const { data: vendorCategories } = await supabase
        .from('vendor_categories')
        .select('vendor_id, category_id, martech_categories(name)');

      const vendorsWithCategories = (vendorsData || []).map((vendor) => {
        const vendorCats = (vendorCategories || [])
          .filter((vc) => vc.vendor_id === vendor.id)
          .map((vc) => (vc.martech_categories as { name: string } | null)?.name || '');
        return { ...vendor, categories: vendorCats };
      });

      // Filter by category if needed
      let filteredVendors = vendorsWithCategories;
      if (categoryFilter !== 'all') {
        const categoryName = categories.find(c => c.id === categoryFilter)?.name;
        filteredVendors = vendorsWithCategories.filter(v => 
          v.categories?.includes(categoryName || '')
        );
      }

      setVendors(filteredVendors);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('martech_categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Category updated' });
      } else {
        const { error } = await supabase
          .from('martech_categories')
          .insert({ name: categoryName });
        if (error) throw error;
        toast({ title: 'Success', description: 'Category created' });
      }

      setCategoryDialogOpen(false);
      setCategoryName('');
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryDialog) return;

    try {
      const { error } = await supabase
        .from('martech_categories')
        .delete()
        .eq('id', deleteCategoryDialog.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Category deleted' });
      setDeleteCategoryDialog(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const openLinkDialog = async (category: Category) => {
    setLinkingCategory(category);
    
    // Fetch existing links
    const [topicCatLinks, topicLinks] = await Promise.all([
      supabase.from('martech_category_topic_categories').select('topic_category_id').eq('martech_category_id', category.id),
      supabase.from('martech_category_topics').select('topic_id').eq('martech_category_id', category.id),
    ]);

    setLinkedTopicCategories((topicCatLinks.data || []).map(l => l.topic_category_id));
    setLinkedTopics((topicLinks.data || []).map(l => l.topic_id));
    setLinkDialogOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!linkingCategory) return;

    setSavingLinks(true);
    try {
      // Delete existing links and insert new ones
      await Promise.all([
        supabase.from('martech_category_topic_categories').delete().eq('martech_category_id', linkingCategory.id),
        supabase.from('martech_category_topics').delete().eq('martech_category_id', linkingCategory.id),
      ]);

      const insertPromises = [];

      if (linkedTopicCategories.length > 0) {
        insertPromises.push(
          supabase.from('martech_category_topic_categories').insert(
            linkedTopicCategories.map(tcId => ({
              martech_category_id: linkingCategory.id,
              topic_category_id: tcId,
            }))
          )
        );
      }

      if (linkedTopics.length > 0) {
        insertPromises.push(
          supabase.from('martech_category_topics').insert(
            linkedTopics.map(tId => ({
              martech_category_id: linkingCategory.id,
              topic_id: tId,
            }))
          )
        );
      }

      await Promise.all(insertPromises);

      toast({ title: 'Success', description: 'Links saved successfully' });
      setLinkDialogOpen(false);
      setLinkingCategory(null);
    } catch (error) {
      console.error('Error saving links:', error);
      toast({
        title: 'Error',
        description: 'Failed to save links',
        variant: 'destructive',
      });
    } finally {
      setSavingLinks(false);
    }
  };

  const toggleTopicCategory = (id: string) => {
    setLinkedTopicCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTopic = (id: string) => {
    setLinkedTopics(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filter and group topics by selected topic categories
  const selectedTopicCategoryKeys = topicCategories
    .filter(tc => linkedTopicCategories.includes(tc.id))
    .map(tc => tc.key);
  
  const filteredTopicsByCategory = linkedTopicCategories.length > 0
    ? topicCategories
        .filter(tc => linkedTopicCategories.includes(tc.id))
        .map(tc => ({
          ...tc,
          topics: topics.filter(t => t.category_key === tc.key),
        }))
    : topicCategories.map(tc => ({
        ...tc,
        topics: topics.filter(t => t.category_key === tc.key),
      }));

  const vendorColumns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'categories',
      header: 'Categories',
      render: (vendor) => (
        <div className="flex flex-wrap gap-1">
          {(vendor.categories || []).slice(0, 2).map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">
              {cat}
            </Badge>
          ))}
          {(vendor.categories || []).length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{(vendor.categories || []).length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'regions',
      header: 'Regions',
      render: (vendor) => (vendor.regions || []).join(', ') || '-',
    },
    {
      key: 'firm_sizes',
      header: 'Firm Sizes',
      render: (vendor) => (vendor.firm_sizes || []).join(', ') || '-',
    },
    {
      key: 'likes_count',
      header: 'Likes',
      sortable: true,
      render: (vendor) => vendor.likes_count || 0,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Martech Map</h1>
          <p className="text-muted-foreground">Manage vendors and categories</p>
        </div>

        {/* Categories Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Categories</CardTitle>
              <CardDescription>Manage martech categories and link them to topics for recommendations</CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setEditingCategory(null);
              setCategoryName('');
              setCategoryDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted"
                >
                  <span className="text-sm">{category.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    title="Link to Topics"
                    onClick={() => openLinkDialog(category)}
                  >
                    <Link2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryName(category.name);
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setDeleteCategoryDialog(category)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendors Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vendors</h2>
            <Button onClick={() => navigate('/admin/martech/vendors/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>

          <div className="flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable
              data={vendors}
              columns={vendorColumns}
              searchPlaceholder="Search vendors..."
              searchKeys={['name', 'description']}
              onRowClick={(vendor) => navigate(`/admin/martech/vendors/${vendor.id}`)}
            />
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Category name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link "{linkingCategory?.name}" to Topics</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Topic Categories */}
            <div className="space-y-3">
              <Label>Topic Categories ({linkedTopicCategories.length} selected)</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {topicCategories.map((tc) => (
                  <label key={tc.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={linkedTopicCategories.includes(tc.id)}
                      onCheckedChange={() => toggleTopicCategory(tc.id)}
                    />
                    <span className="text-sm">{tc.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-3">
              <Label>
                Topics ({linkedTopics.length} selected)
                {linkedTopicCategories.length > 0 && (
                  <span className="text-muted-foreground ml-2 text-xs">(filtered by selected categories)</span>
                )}
              </Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-3">
                {filteredTopicsByCategory.map((tc) => (
                  tc.topics.length > 0 && (
                    <div key={tc.id}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{tc.name}</p>
                      <div className="space-y-1 ml-2">
                        {tc.topics.map((t) => (
                          <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={linkedTopics.includes(t.id)}
                              onCheckedChange={() => toggleTopic(t.id)}
                            />
                            <span className="text-sm">{t.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                {(linkedTopicCategories.length > 0 && filteredTopicsByCategory.every(tc => tc.topics.length === 0)) && (
                  <p className="text-sm text-muted-foreground">No topics in selected categories.</p>
                )}
                {linkedTopicCategories.length === 0 && topics.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active topics found.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLinks} disabled={savingLinks}>
              {savingLinks ? 'Saving...' : 'Save Links'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={!!deleteCategoryDialog}
        onOpenChange={() => setDeleteCategoryDialog(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteCategoryDialog?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCategory}
        variant="destructive"
      />
    </AdminLayout>
  );
}
