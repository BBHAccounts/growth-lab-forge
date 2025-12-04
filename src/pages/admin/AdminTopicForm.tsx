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
  key: string;
  name: string;
  description: string;
  category_key: string;
  recommended_for: string;
  order_index: number;
  recommended_seniority: string[];
  recommended_roles: string[];
  recommended_firm_sizes: string[];
  recommended_firm_types: string[];
  national_or_international: string[];
  min_growth_maturity: number;
  max_growth_maturity: number;
  min_data_maturity: number;
  max_data_maturity: number;
  active: boolean;
}

interface TopicCategory {
  id: string;
  key: string;
  name: string;
  order_index: number;
}

const defaultTopic: Topic = {
  key: '',
  name: '',
  description: '',
  category_key: '',
  recommended_for: '',
  order_index: 0,
  recommended_seniority: [],
  recommended_roles: [],
  recommended_firm_sizes: [],
  recommended_firm_types: [],
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
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch topic categories
      const { data: topicCatsData } = await supabase
        .from('topic_categories')
        .select('id, key, name, order_index')
        .order('order_index');

      setTopicCategories(topicCatsData || []);

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
          key: topicData.key || '',
          category_key: topicData.category_key || '',
          recommended_for: topicData.recommended_for || '',
          order_index: topicData.order_index || 0,
          recommended_seniority: topicData.recommended_seniority || [],
          recommended_roles: topicData.recommended_roles || [],
          recommended_firm_sizes: topicData.recommended_firm_sizes || [],
          recommended_firm_types: topicData.recommended_firm_types || [],
          national_or_international: topicData.national_or_international || [],
        });
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
      const topicData = {
        key: topic.key || null,
        name: topic.name,
        description: topic.description,
        category_key: topic.category_key || null,
        recommended_for: topic.recommended_for || null,
        order_index: topic.order_index,
        recommended_seniority: topic.recommended_seniority,
        recommended_roles: topic.recommended_roles,
        recommended_firm_sizes: topic.recommended_firm_sizes,
        recommended_firm_types: topic.recommended_firm_types,
        national_or_international: topic.national_or_international,
        min_growth_maturity: topic.min_growth_maturity,
        max_growth_maturity: topic.max_growth_maturity,
        min_data_maturity: topic.min_data_maturity,
        max_data_maturity: topic.max_data_maturity,
        active: topic.active,
      };

      if (isNew) {
        const { error } = await supabase.from('topics').insert([topicData]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('topics').update(topicData).eq('id', topicId);
        if (error) throw error;
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
                <Label>Key (unique identifier)</Label>
                <Input
                  value={topic.key}
                  onChange={(e) => setTopic({ ...topic, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="firm_growth_strategy"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={topic.category_key}
                  onChange={(e) => setTopic({ ...topic, category_key: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select category...</option>
                  {topicCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.name}</option>
                  ))}
                </select>
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
                <Label>Recommended For (human-readable)</Label>
                <Textarea
                  value={topic.recommended_for}
                  onChange={(e) => setTopic({ ...topic, recommended_for: e.target.value })}
                  placeholder="Senior partners and BD leaders in firms of any size..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Index</Label>
                  <Input
                    type="number"
                    value={topic.order_index}
                    onChange={(e) => setTopic({ ...topic, order_index: parseInt(e.target.value) || 0 })}
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
                <Label>Scope (National/International)</Label>
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Maturity Levels</CardTitle>
              <CardDescription>Set the minimum and maximum maturity levels for targeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
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
