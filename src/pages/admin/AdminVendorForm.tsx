import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Trash2, Wand2, Loader2, Sparkles, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
}

interface Vendor {
  id?: string;
  name: string;
  description: string;
  website_url: string;
  logo_url: string;
  regions: string[];
  firm_sizes: string[];
}

interface TopicItem {
  id: string;
  name: string;
  category_key: string | null;
  linked: boolean;
}

interface TopicCategoryItem {
  id: string;
  key: string;
  name: string;
  linked: boolean;
}

const REGIONS = ['Europe', 'North America', 'Asia Pacific', 'Middle East', 'Latin America', 'Global'];
const FIRM_SIZES = ['1-50', '51-200', '201-500', '500+'];

const defaultVendor: Vendor = {
  name: '',
  description: '',
  website_url: '',
  logo_url: '',
  regions: [],
  firm_sizes: [],
};

export default function AdminVendorForm() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = vendorId === 'new';

  const [vendor, setVendor] = useState<Vendor>(defaultVendor);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [topicCategories, setTopicCategories] = useState<TopicCategoryItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [suggestedTopicCategories, setSuggestedTopicCategories] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [notifyUsers, setNotifyUsers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories, topic categories, and topics in parallel
        const [categoriesRes, topicCatsRes, topicsRes] = await Promise.all([
          supabase.from('martech_categories').select('*').order('name'),
          supabase.from('topic_categories').select('id, key, name').order('order_index'),
          supabase.from('topics').select('id, name, category_key').eq('active', true).order('order_index'),
        ]);
        
        setCategories(categoriesRes.data || []);

        if (!isNew && vendorId) {
          // Fetch vendor and linked data
          const [vendorRes, vendorCatsRes, vendorTopicCatsRes, vendorTopicsRes] = await Promise.all([
            supabase.from('vendors').select('*').eq('id', vendorId).single(),
            supabase.from('vendor_categories').select('category_id').eq('vendor_id', vendorId),
            supabase.from('vendor_topic_categories').select('topic_category_id').eq('vendor_id', vendorId),
            supabase.from('vendor_topics').select('topic_id').eq('vendor_id', vendorId),
          ]);

          if (vendorRes.error) throw vendorRes.error;
          
          setVendor({
            ...defaultVendor,
            ...vendorRes.data,
            regions: vendorRes.data.regions || [],
            firm_sizes: vendorRes.data.firm_sizes || [],
          });
          
          setSelectedCategories((vendorCatsRes.data || []).map(vc => vc.category_id));
          
          const linkedTopicCatIds = new Set((vendorTopicCatsRes.data || []).map((l) => l.topic_category_id));
          const linkedTopicIds = new Set((vendorTopicsRes.data || []).map((l) => l.topic_id));
          
          setTopicCategories((topicCatsRes.data || []).map((tc) => ({ id: tc.id, key: tc.key, name: tc.name, linked: linkedTopicCatIds.has(tc.id) })));
          setTopics((topicsRes.data || []).map((t) => ({ id: t.id, name: t.name, category_key: t.category_key, linked: linkedTopicIds.has(t.id) })));
        } else {
          setTopicCategories((topicCatsRes.data || []).map((tc) => ({ id: tc.id, key: tc.key, name: tc.name, linked: false })));
          setTopics((topicsRes.data || []).map((t) => ({ id: t.id, name: t.name, category_key: t.category_key, linked: false })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorId, isNew, toast]);

  const handleExtractMetadata = async () => {
    if (!vendor.website_url) {
      toast({
        title: 'Error',
        description: 'Please enter a website URL first',
        variant: 'destructive',
      });
      return;
    }

    setExtracting(true);
    setSuggestedCategories([]);
    setSuggestedTopicCategories([]);
    setSuggestedTopics([]);

    try {
      const { data, error } = await supabase.functions.invoke('extract-vendor-metadata', {
        body: { 
          url: vendor.website_url,
          categories: categories,
          topicCategories: topicCategories.map(tc => ({ id: tc.id, key: tc.key, name: tc.name })),
          topics: topics.map(t => ({ id: t.id, name: t.name, category_key: t.category_key })),
        },
      });

      if (error) throw error;

      // Update vendor with extracted data
      setVendor(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        logo_url: data.logo_url || prev.logo_url,
      }));

      // Store suggested categories for display
      if (data.suggested_categories && data.suggested_categories.length > 0) {
        setSuggestedCategories(data.suggested_categories);
      }
      if (data.suggested_topic_categories?.length > 0) {
        setSuggestedTopicCategories(data.suggested_topic_categories);
      }
      if (data.suggested_topics?.length > 0) {
        setSuggestedTopics(data.suggested_topics);
      }

      toast({
        title: 'Success',
        description: 'Metadata extracted successfully',
      });
    } catch (error) {
      console.error('Error extracting metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract metadata from URL',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  const applySuggestedCategories = () => {
    setSelectedCategories(prev => {
      const combined = new Set([...prev, ...suggestedCategories]);
      return Array.from(combined);
    });
    setSuggestedCategories([]);
    toast({
      title: 'Applied',
      description: 'Suggested categories have been added',
    });
  };

  const applySuggestedTopicCategories = () => {
    setTopicCategories(prev => prev.map(tc => ({
      ...tc,
      linked: tc.linked || suggestedTopicCategories.includes(tc.id)
    })));
    setSuggestedTopicCategories([]);
    toast({ title: 'Applied', description: 'Suggested topic categories have been added' });
  };

  const applySuggestedTopics = () => {
    setTopics(prev => prev.map(t => ({
      ...t,
      linked: t.linked || suggestedTopics.includes(t.id)
    })));
    setSuggestedTopics([]);
    toast({ title: 'Applied', description: 'Suggested topics have been added' });
  };

  const handleSave = async () => {
    if (!vendor.name.trim()) {
      toast({
        title: 'Error',
        description: 'Vendor name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const vendorData = {
        name: vendor.name,
        description: vendor.description,
        website_url: vendor.website_url,
        logo_url: vendor.logo_url,
        regions: vendor.regions,
        firm_sizes: vendor.firm_sizes,
      };

      let vendorIdToUse = vendorId;

      if (isNew) {
        const { data, error } = await supabase
          .from('vendors')
          .insert([vendorData])
          .select('id')
          .single();
        if (error) throw error;
        vendorIdToUse = data.id;
      } else {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendorId);
        if (error) throw error;
      }

      // Update categories
      if (vendorIdToUse) {
        await supabase.from('vendor_categories').delete().eq('vendor_id', vendorIdToUse);
        if (selectedCategories.length > 0) {
          await supabase.from('vendor_categories').insert(
            selectedCategories.map((categoryId) => ({
              vendor_id: vendorIdToUse,
              category_id: categoryId,
            }))
          );
        }

        // Update linked topic categories
        await supabase.from('vendor_topic_categories').delete().eq('vendor_id', vendorIdToUse);
        const linkedTopicCatIds = topicCategories.filter((tc) => tc.linked).map((tc) => ({ vendor_id: vendorIdToUse, topic_category_id: tc.id }));
        if (linkedTopicCatIds.length > 0) {
          await supabase.from('vendor_topic_categories').insert(linkedTopicCatIds);
        }

        // Update linked topics
        await supabase.from('vendor_topics').delete().eq('vendor_id', vendorIdToUse);
        const linkedTopicIds = topics.filter((t) => t.linked).map((t) => ({ vendor_id: vendorIdToUse, topic_id: t.id }));
        if (linkedTopicIds.length > 0) {
          await supabase.from('vendor_topics').insert(linkedTopicIds);
        }
      }

      // Send notification if toggle is on
      if (notifyUsers) {
        await supabase.rpc('notify_all_users', {
          p_type: 'new_vendor',
          p_title: `New Vendor Added: ${vendor.name}`,
          p_message: vendor.description || 'Discover a new martech vendor!',
          p_link: '/martech',
          p_reference_id: vendorIdToUse,
        });
      }

      toast({
        title: 'Success',
        description: isNew ? 'Vendor created successfully' : 'Vendor updated successfully',
      });
      navigate('/admin/martech');
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to save vendor',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !vendorId) return;

    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Vendor deleted successfully' });
      navigate('/admin/martech');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor',
        variant: 'destructive',
      });
    }
  };

  const toggleRegion = (region: string) => {
    setVendor({
      ...vendor,
      regions: vendor.regions.includes(region)
        ? vendor.regions.filter((r) => r !== region)
        : [...vendor.regions, region],
    });
  };

  const toggleFirmSize = (size: string) => {
    setVendor({
      ...vendor,
      firm_sizes: vendor.firm_sizes.includes(size)
        ? vendor.firm_sizes.filter((s) => s !== size)
        : [...vendor.firm_sizes, size],
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(
      selectedCategories.includes(categoryId)
        ? selectedCategories.filter((c) => c !== categoryId)
        : [...selectedCategories, categoryId]
    );
  };

  const toggleTopicCategory = (topicCategoryId: string) => {
    setTopicCategories((prev) =>
      prev.map((tc) => (tc.id === topicCategoryId ? { ...tc, linked: !tc.linked } : tc))
    );
  };

  const toggleTopic = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, linked: !t.linked } : t))
    );
  };

  // Filter topics by selected topic categories
  const selectedTopicCategoryKeys = topicCategories.filter(tc => tc.linked).map(tc => tc.key);
  const filteredTopics = selectedTopicCategoryKeys.length > 0 
    ? topics.filter(t => t.category_key && selectedTopicCategoryKeys.includes(t.category_key))
    : topics;

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/martech')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Add Vendor' : 'Edit Vendor'}</h1>
              <p className="text-muted-foreground">
                {isNew ? 'Add a new martech vendor' : vendor.name}
              </p>
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
                <Label>Website URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={vendor.website_url}
                    onChange={(e) => setVendor({ ...vendor, website_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleExtractMetadata}
                    disabled={extracting || !vendor.website_url}
                  >
                    {extracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Auto-fill</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the website URL and click Auto-fill to extract vendor details
                </p>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={vendor.name}
                  onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
                  placeholder="Vendor name"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={vendor.description}
                  onChange={(e) => setVendor({ ...vendor, description: e.target.value })}
                  placeholder="Vendor description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={vendor.logo_url}
                  onChange={(e) => setVendor({ ...vendor, logo_url: e.target.value })}
                  placeholder="https://..."
                />
                {vendor.logo_url && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/30">
                    <img 
                      src={vendor.logo_url} 
                      alt="Logo preview" 
                      className="h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Martech Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Martech Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedCategories.length > 0 && (
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Suggested Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestedCategories.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? (
                        <Badge key={catId} variant="secondary">{cat.name}</Badge>
                      ) : null;
                    })}
                  </div>
                  <Button size="sm" onClick={applySuggestedCategories}>
                    Apply Suggestions
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <label htmlFor={`cat-${category.id}`} className="text-sm">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations - Topic Categories & Topics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Link to topic categories and topics for recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Topic Categories */}
                <div className="space-y-4">
                  {suggestedTopicCategories.length > 0 && (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Suggested Topic Categories</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {suggestedTopicCategories.map(tcId => {
                          const tc = topicCategories.find(c => c.id === tcId);
                          return tc ? (
                            <Badge key={tcId} variant="secondary">{tc.name}</Badge>
                          ) : null;
                        })}
                      </div>
                      <Button size="sm" onClick={applySuggestedTopicCategories}>
                        Apply Suggestions
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Topic Categories ({topicCategories.filter((tc) => tc.linked).length} selected)</Label>
                    {topicCategories.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {topicCategories.map((tc) => (
                          <label key={tc.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={tc.linked}
                              onCheckedChange={() => toggleTopicCategory(tc.id)}
                            />
                            <span className="text-sm">{tc.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No topic categories found.</p>
                    )}
                  </div>
                </div>

                {/* Topics */}
                <div className="space-y-4">
                  {suggestedTopics.length > 0 && (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Suggested Topics</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {suggestedTopics.map(tId => {
                          const t = topics.find(topic => topic.id === tId);
                          return t ? (
                            <Badge key={tId} variant="secondary">{t.name}</Badge>
                          ) : null;
                        })}
                      </div>
                      <Button size="sm" onClick={applySuggestedTopics}>
                        Apply Suggestions
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Topics ({topics.filter((t) => t.linked).length} selected)
                      {selectedTopicCategoryKeys.length > 0 && (
                        <span className="text-muted-foreground ml-2">(filtered by selected categories)</span>
                      )}
                    </Label>
                    {filteredTopics.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {filteredTopics.map((topic) => (
                          <label key={topic.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={topic.linked}
                              onCheckedChange={() => toggleTopic(topic.id)}
                            />
                            <span className="text-sm">{topic.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {selectedTopicCategoryKeys.length > 0 
                          ? 'No topics in selected categories.' 
                          : 'No active topics found.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regions */}
          <Card>
            <CardHeader>
              <CardTitle>Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {REGIONS.map((region) => (
                  <div key={region} className="flex items-center gap-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={vendor.regions.includes(region)}
                      onCheckedChange={() => toggleRegion(region)}
                    />
                    <label htmlFor={`region-${region}`} className="text-sm">
                      {region}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Firm Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Firm Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {FIRM_SIZES.map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={vendor.firm_sizes.includes(size)}
                      onCheckedChange={() => toggleFirmSize(size)}
                    />
                    <label htmlFor={`size-${size}`} className="text-sm">
                      {size} employees
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Notify Users</p>
                    <p className="text-sm text-muted-foreground">
                      Send a notification to all users about this {isNew ? 'new' : ''} vendor
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifyUsers}
                  onCheckedChange={setNotifyUsers}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/martech')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Vendor'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </AdminLayout>
  );
}
