import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface Topic {
  id?: string;
  name: string;
  description: string;
  recommended_seniority: string[];
  recommended_roles: string[];
  recommended_firm_sizes: string[];
  recommended_firm_types: string[];
  interest_area_keywords: string[];
  national_or_international: string[];
  min_growth_maturity: number;
  max_growth_maturity: number;
  min_data_maturity: number;
  max_data_maturity: number;
  active: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  linked: boolean;
}

interface ModelItem {
  id: string;
  name: string;
  emoji: string | null;
  linked: boolean;
}

const defaultTopic: Topic = {
  name: '',
  description: '',
  recommended_seniority: [],
  recommended_roles: [],
  recommended_firm_sizes: [],
  recommended_firm_types: [],
  interest_area_keywords: [],
  national_or_international: [],
  min_growth_maturity: 1,
  max_growth_maturity: 5,
  min_data_maturity: 1,
  max_data_maturity: 5,
  active: true,
};

const SENIORITY_OPTIONS = ['junior', 'mid', 'senior', 'executive'];
const ROLE_OPTIONS = ['lawyer', 'partner', 'associate', 'mbd', 'operations', 'other'];
const FIRM_SIZE_OPTIONS = ['small', 'medium', 'large', 'global'];
const FIRM_TYPE_OPTIONS = ['law_firm', 'in_house', 'consulting', 'government', 'academia'];
const SCOPE_OPTIONS = ['national', 'international'];

export default function AdminTopicForm() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = topicId === 'new';

  const [topic, setTopic] = useState<Topic>(defaultTopic);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [vendorCategories, setVendorCategories] = useState<CategoryItem[]>([]);
  const [resourceCategories, setResourceCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all models and categories
      const [modelsRes, vendorCatsRes, resourceCatsRes] = await Promise.all([
        supabase.from('models').select('id, name, emoji').eq('status', 'active').order('name'),
        supabase.from('martech_categories').select('id, name').order('name'),
        supabase.from('resource_categories').select('id, name').order('name'),
      ]);

      if (!isNew && topicId) {
        // Fetch topic
        const { data: topicData, error } = await supabase
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single();

        if (error) {
          console.error('Error fetching topic:', error);
          toast({ title: 'Error', description: 'Failed to load topic', variant: 'destructive' });
          return;
        }

        setTopic({
          ...defaultTopic,
          ...topicData,
          recommended_seniority: topicData.recommended_seniority || [],
          recommended_roles: topicData.recommended_roles || [],
          recommended_firm_sizes: topicData.recommended_firm_sizes || [],
          recommended_firm_types: topicData.recommended_firm_types || [],
          interest_area_keywords: topicData.interest_area_keywords || [],
          national_or_international: topicData.national_or_international || [],
        });

        // Fetch linked models and categories
        const [linkedModels, linkedVendorCats, linkedResourceCats] = await Promise.all([
          supabase.from('topic_models').select('model_id').eq('topic_id', topicId),
          supabase.from('topic_vendor_categories').select('category_id').eq('topic_id', topicId),
          supabase.from('topic_resource_categories').select('category_id').eq('topic_id', topicId),
        ]);

        const linkedModelIds = new Set((linkedModels.data || []).map((l) => l.model_id));
        const linkedVendorCatIds = new Set((linkedVendorCats.data || []).map((l) => l.category_id));
        const linkedResourceCatIds = new Set((linkedResourceCats.data || []).map((l) => l.category_id));

        setModels((modelsRes.data || []).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, linked: linkedModelIds.has(m.id) })));
        setVendorCategories((vendorCatsRes.data || []).map((c) => ({ id: c.id, name: c.name, linked: linkedVendorCatIds.has(c.id) })));
        setResourceCategories((resourceCatsRes.data || []).map((c) => ({ id: c.id, name: c.name, linked: linkedResourceCatIds.has(c.id) })));
      } else {
        setModels((modelsRes.data || []).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, linked: false })));
        setVendorCategories((vendorCatsRes.data || []).map((c) => ({ id: c.id, name: c.name, linked: false })));
        setResourceCategories((resourceCatsRes.data || []).map((c) => ({ id: c.id, name: c.name, linked: false })));
      }

      setLoading(false);
    };

    fetchData();
  }, [topicId, isNew, toast]);

  const handleSave = async () => {
    if (!topic.name.trim()) {
      toast({ title: 'Error', description: 'Topic name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let savedTopicId = topicId;

      const topicData = {
        name: topic.name,
        description: topic.description,
        recommended_seniority: topic.recommended_seniority,
        recommended_roles: topic.recommended_roles,
        recommended_firm_sizes: topic.recommended_firm_sizes,
        recommended_firm_types: topic.recommended_firm_types,
        interest_area_keywords: topic.interest_area_keywords,
        national_or_international: topic.national_or_international,
        min_growth_maturity: topic.min_growth_maturity,
        max_growth_maturity: topic.max_growth_maturity,
        min_data_maturity: topic.min_data_maturity,
        max_data_maturity: topic.max_data_maturity,
        active: topic.active,
      };

      if (isNew) {
        const { data, error } = await supabase.from('topics').insert([topicData]).select('id').single();
        if (error) throw error;
        savedTopicId = data.id;
      } else {
        const { error } = await supabase.from('topics').update(topicData).eq('id', topicId);
        if (error) throw error;
      }

      // Update linked models (direct link)
      await supabase.from('topic_models').delete().eq('topic_id', savedTopicId);
      const linkedModelIds = models.filter((m) => m.linked).map((m) => ({ topic_id: savedTopicId, model_id: m.id }));
      if (linkedModelIds.length > 0) {
        await supabase.from('topic_models').insert(linkedModelIds);
      }

      // Update linked vendor categories
      await supabase.from('topic_vendor_categories').delete().eq('topic_id', savedTopicId);
      const linkedVendorCatIds = vendorCategories.filter((c) => c.linked).map((c) => ({ topic_id: savedTopicId, category_id: c.id }));
      if (linkedVendorCatIds.length > 0) {
        await supabase.from('topic_vendor_categories').insert(linkedVendorCatIds);
      }

      // Update linked resource categories
      await supabase.from('topic_resource_categories').delete().eq('topic_id', savedTopicId);
      const linkedResourceCatIds = resourceCategories.filter((c) => c.linked).map((c) => ({ topic_id: savedTopicId, category_id: c.id }));
      if (linkedResourceCatIds.length > 0) {
        await supabase.from('topic_resource_categories').insert(linkedResourceCatIds);
      }

      toast({ title: 'Success', description: isNew ? 'Topic created successfully' : 'Topic updated successfully' });
      navigate('/admin/topics');
    } catch (error) {
      console.error('Error saving topic:', error);
      toast({ title: 'Error', description: 'Failed to save topic', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !topicId) return;

    try {
      const { error } = await supabase.from('topics').delete().eq('id', topicId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      navigate('/admin/topics');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({ title: 'Error', description: 'Failed to delete topic', variant: 'destructive' });
    }
  };

  const toggleArrayField = (field: keyof Topic, value: string) => {
    const current = topic[field] as string[];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setTopic({ ...topic, [field]: updated });
  };

  const updateKeywords = (value: string) => {
    setTopic({
      ...topic,
      interest_area_keywords: value.split(',').map((v) => v.trim()).filter(Boolean),
    });
  };

  const toggleModel = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, linked: !m.linked } : m))
    );
  };

  const toggleCategory = (type: 'vendor' | 'resource', categoryId: string) => {
    if (type === 'vendor') {
      setVendorCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, linked: !c.linked } : c))
      );
    } else {
      setResourceCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, linked: !c.linked } : c))
      );
    }
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/topics')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Create Topic' : 'Edit Topic'}</h1>
              <p className="text-muted-foreground">{isNew ? 'Create a new recommendation topic' : topic.name}</p>
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
                <Label>Name *</Label>
                <Input
                  value={topic.name}
                  onChange={(e) => setTopic({ ...topic, name: e.target.value })}
                  placeholder="Topic name"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={topic.description}
                  onChange={(e) => setTopic({ ...topic, description: e.target.value })}
                  placeholder="What this topic covers..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Interest Area Keywords (comma-separated)</Label>
                <Input
                  value={topic.interest_area_keywords.join(', ')}
                  onChange={(e) => updateKeywords(e.target.value)}
                  placeholder="growth, marketing, BD, technology..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Show in recommendations</p>
                </div>
                <Switch
                  checked={topic.active}
                  onCheckedChange={(checked) => setTopic({ ...topic, active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Targeting */}
          <Card>
            <CardHeader>
              <CardTitle>Targeting Rules</CardTitle>
              <CardDescription>Define who this topic is relevant for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Recommended Seniority</Label>
                <div className="flex flex-wrap gap-3">
                  {SENIORITY_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={topic.recommended_seniority.includes(opt)}
                        onCheckedChange={() => toggleArrayField('recommended_seniority', opt)}
                      />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recommended Roles</Label>
                <div className="flex flex-wrap gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={topic.recommended_roles.includes(opt)}
                        onCheckedChange={() => toggleArrayField('recommended_roles', opt)}
                      />
                      <span className="text-sm capitalize">{opt === 'mbd' ? 'Marketing/BD' : opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recommended Firm Sizes</Label>
                <div className="flex flex-wrap gap-3">
                  {FIRM_SIZE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={topic.recommended_firm_sizes.includes(opt)}
                        onCheckedChange={() => toggleArrayField('recommended_firm_sizes', opt)}
                      />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recommended Firm Types</Label>
                <div className="flex flex-wrap gap-3">
                  {FIRM_TYPE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={topic.recommended_firm_types.includes(opt)}
                        onCheckedChange={() => toggleArrayField('recommended_firm_types', opt)}
                      />
                      <span className="text-sm capitalize">{opt.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scope</Label>
                <div className="flex flex-wrap gap-3">
                  {SCOPE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={topic.national_or_international.includes(opt)}
                        onCheckedChange={() => toggleArrayField('national_or_international', opt)}
                      />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maturity Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Maturity Targeting</CardTitle>
              <CardDescription>Match users by their maturity levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Growth Maturity Range: {topic.min_growth_maturity} - {topic.max_growth_maturity}</Label>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[topic.min_growth_maturity, topic.max_growth_maturity]}
                  onValueChange={([min, max]) => setTopic({ ...topic, min_growth_maturity: min, max_growth_maturity: max })}
                />
              </div>

              <div className="space-y-4">
                <Label>Data Maturity Range: {topic.min_data_maturity} - {topic.max_data_maturity}</Label>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[topic.min_data_maturity, topic.max_data_maturity]}
                  onValueChange={([min, max]) => setTopic({ ...topic, min_data_maturity: min, max_data_maturity: max })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Linked Models */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Models</CardTitle>
              <CardDescription>Select models to recommend for this topic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Models ({models.filter((m) => m.linked).length} selected)</Label>
                {models.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                    {models.map((model) => (
                      <label key={model.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={model.linked}
                          onCheckedChange={() => toggleModel(model.id)}
                        />
                        <span className="text-sm">{model.emoji} {model.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active models found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Categories</CardTitle>
              <CardDescription>Select vendor and resource categories to recommend for this topic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Vendor Categories ({vendorCategories.filter((c) => c.linked).length} selected)</Label>
                {vendorCategories.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                    {vendorCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={cat.linked}
                          onCheckedChange={() => toggleCategory('vendor', cat.id)}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vendor categories defined yet. Create them in the Martech section.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Resource Categories ({resourceCategories.filter((c) => c.linked).length} selected)</Label>
                {resourceCategories.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                    {resourceCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={cat.linked}
                          onCheckedChange={() => toggleCategory('resource', cat.id)}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No resource categories defined yet. Create them in the Resources section.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/topics')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Topic'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Topic"
        description="Are you sure you want to delete this topic? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </AdminLayout>
  );
}
