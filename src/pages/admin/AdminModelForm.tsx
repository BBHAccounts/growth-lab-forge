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
import { ArrowLeft, Save, Trash2, Plus, X, GripVertical, User, Bell, Sparkles } from 'lucide-react';

interface Step {
  title: string;
  instruction: string;
  fields: {
    type: string;
    label: string;
    placeholder?: string;
    columns?: { id: string; label: string }[];
    options?: string[];
  }[];
}

interface Model {
  id?: string;
  name: string;
  slug: string;
  emoji: string;
  short_description: string;
  long_description: string;
  audience: string[];
  time_estimate: string;
  tags: string[];
  outcomes: string[];
  unlock_level: string;
  status: string;
  featured: boolean;
  video_url: string;
  suggested_actions: string[];
  steps: Step[];
  ai_assistant_prompt: string;
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

const defaultModel: Model = {
  name: '',
  slug: '',
  emoji: '📚',
  short_description: '',
  long_description: '',
  audience: [],
  time_estimate: '',
  tags: [],
  outcomes: [],
  unlock_level: 'registered',
  status: 'draft',
  featured: false,
  video_url: '',
  suggested_actions: [],
  steps: [],
  ai_assistant_prompt: '',
};

export default function AdminModelForm() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = modelId === 'new';

  const [model, setModel] = useState<Model>(defaultModel);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicCategories, setTopicCategories] = useState<TopicCategoryItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [notifyUsers, setNotifyUsers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all active topics, topic categories, and admin users in parallel
      const [topicsRes, topicCatsRes, adminRolesRes] = await Promise.all([
        supabase.from('topics').select('id, name, category_key').eq('active', true).order('order_index'),
        supabase.from('topic_categories').select('id, key, name').order('order_index'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
      ]);

      const topicsData = topicsRes.data;
      const topicCatsData = topicCatsRes.data;
      const adminUserIds = (adminRolesRes.data || []).map((r) => r.user_id);

      // Fetch profiles for admin users
      let adminUsersData: { id: string; name: string; email: string }[] = [];
      if (adminUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', adminUserIds);
        
        adminUsersData = (profiles || []).map((p) => ({
          id: p.user_id,
          name: p.full_name || 'Unknown',
          email: p.email || '',
        }));
      }
      setAdminUsers(adminUsersData);

      if (!isNew && modelId) {
        try {
          const [modelRes, linkedTopicsRes, linkedTopicCatsRes] = await Promise.all([
            supabase.from('models').select('*').eq('id', modelId).single(),
            supabase.from('topic_models').select('topic_id').eq('model_id', modelId),
            supabase.from('model_topic_categories').select('topic_category_id').eq('model_id', modelId),
          ]);

          if (modelRes.error) throw modelRes.error;
          
          const linkedTopicIds = new Set((linkedTopicsRes.data || []).map((l) => l.topic_id));
          const linkedTopicCatIds = new Set((linkedTopicCatsRes.data || []).map((l) => l.topic_category_id));
          
          setModel({
            ...defaultModel,
            ...modelRes.data,
            steps: (modelRes.data.steps as unknown as Step[]) || [],
            audience: modelRes.data.audience || [],
            tags: modelRes.data.tags || [],
            outcomes: modelRes.data.outcomes || [],
            suggested_actions: modelRes.data.suggested_actions || [],
            ai_assistant_prompt: modelRes.data.ai_assistant_prompt || '',
          });
          
          setOwnerId(modelRes.data.owner_id || null);
          
          setTopics((topicsData || []).map((t) => ({ id: t.id, name: t.name, category_key: t.category_key, linked: linkedTopicIds.has(t.id) })));
          setTopicCategories((topicCatsData || []).map((tc) => ({ id: tc.id, key: tc.key, name: tc.name, linked: linkedTopicCatIds.has(tc.id) })));
        } catch (error) {
          console.error('Error fetching model:', error);
          toast({
            title: 'Error',
            description: 'Failed to load model',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setOwnerId(user.id);
        }
        setTopics((topicsData || []).map((t) => ({ id: t.id, name: t.name, category_key: t.category_key, linked: false })));
        setTopicCategories((topicCatsData || []).map((tc) => ({ id: tc.id, key: tc.key, name: tc.name, linked: false })));
        setLoading(false);
      }
    };

    fetchData();
  }, [modelId, isNew, toast]);

  const handleSave = async () => {
    if (!model.name.trim()) {
      toast({
        title: 'Error',
        description: 'Model name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const modelData = {
        name: model.name,
        slug: model.slug || model.name.toLowerCase().replace(/\s+/g, '-'),
        emoji: model.emoji,
        short_description: model.short_description,
        long_description: model.long_description,
        audience: model.audience,
        time_estimate: model.time_estimate,
        tags: model.tags,
        outcomes: model.outcomes,
        unlock_level: model.unlock_level,
        status: model.status,
        featured: model.featured,
        video_url: model.video_url,
        suggested_actions: model.suggested_actions,
        steps: JSON.parse(JSON.stringify(model.steps)),
        owner_id: ownerId,
      };

      let savedModelId = modelId;
      
      if (isNew) {
        const { data, error } = await supabase.from('models').insert([modelData] as never).select('id').single();
        if (error) throw error;
        savedModelId = data.id;
        toast({ title: 'Success', description: 'Model created successfully' });
      } else {
        const { error } = await supabase
          .from('models')
          .update(modelData as never)
          .eq('id', modelId);
        if (error) throw error;
        toast({ title: 'Success', description: 'Model updated successfully' });
      }

      // Update linked topics
      await supabase.from('topic_models').delete().eq('model_id', savedModelId);
      const linkedTopicIds = topics.filter((t) => t.linked).map((t) => ({ topic_id: t.id, model_id: savedModelId }));
      if (linkedTopicIds.length > 0) {
        await supabase.from('topic_models').insert(linkedTopicIds);
      }

      // Update linked topic categories
      await supabase.from('model_topic_categories').delete().eq('model_id', savedModelId);
      const linkedTopicCatIds = topicCategories.filter((tc) => tc.linked).map((tc) => ({ topic_category_id: tc.id, model_id: savedModelId }));
      if (linkedTopicCatIds.length > 0) {
        await supabase.from('model_topic_categories').insert(linkedTopicCatIds);
      }

      // Send notification if toggle is on
      if (notifyUsers && model.status === 'active') {
        await supabase.rpc('notify_all_users', {
          p_type: 'new_model',
          p_title: `New Model Available: ${model.name}`,
          p_message: model.short_description || 'Check out our latest model!',
          p_link: `/models/${model.slug || savedModelId}`,
          p_reference_id: savedModelId,
        });
      }

      navigate('/admin/models');
    } catch (error) {
      console.error('Error saving model:', error);
      toast({
        title: 'Error',
        description: 'Failed to save model',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !modelId) return;

    try {
      const { error } = await supabase.from('models').delete().eq('id', modelId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Model deleted successfully' });
      navigate('/admin/models');
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete model',
        variant: 'destructive',
      });
    }
  };

  const addStep = () => {
    setModel({
      ...model,
      steps: [...model.steps, { title: '', instruction: '', fields: [] }],
    });
  };

  const removeStep = (index: number) => {
    setModel({
      ...model,
      steps: model.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, updates: Partial<Step>) => {
    setModel({
      ...model,
      steps: model.steps.map((step, i) => (i === index ? { ...step, ...updates } : step)),
    });
  };

  const updateArrayField = (field: 'tags' | 'outcomes' | 'audience' | 'suggested_actions', value: string) => {
    setModel({
      ...model,
      [field]: value.split(',').map((v) => v.trim()).filter(Boolean),
    });
  };

  const toggleTopic = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, linked: !t.linked } : t))
    );
  };

  const toggleTopicCategory = (topicCategoryId: string) => {
    setTopicCategories((prev) =>
      prev.map((tc) => (tc.id === topicCategoryId ? { ...tc, linked: !tc.linked } : tc))
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/models')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Create Model' : 'Edit Model'}</h1>
              <p className="text-muted-foreground">
                {isNew ? 'Create a new toolbox model' : model.name}
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
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <Input
                    value={model.emoji}
                    onChange={(e) => setModel({ ...model, emoji: e.target.value })}
                    className="text-center text-xl"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={model.name}
                    onChange={(e) => setModel({ ...model, name: e.target.value })}
                    placeholder="Model name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={model.slug}
                  onChange={(e) => setModel({ ...model, slug: e.target.value })}
                  placeholder="model-slug"
                />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  value={model.short_description}
                  onChange={(e) => setModel({ ...model, short_description: e.target.value })}
                  placeholder="Brief description for cards"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea
                  value={model.long_description}
                  onChange={(e) => setModel({ ...model, long_description: e.target.value })}
                  placeholder="Detailed description for detail page"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Time Estimate</Label>
                <Input
                  value={model.time_estimate}
                  onChange={(e) => setModel({ ...model, time_estimate: e.target.value })}
                  placeholder="e.g., 30 minutes"
                />
              </div>

              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input
                  value={model.video_url}
                  onChange={(e) => setModel({ ...model, video_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Model Owner
                </Label>
                <Select
                  value={ownerId || ''}
                  onValueChange={(value) => setOwnerId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} {admin.email && `(${admin.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Only admin users can be model owners</p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={model.status}
                  onValueChange={(value) => setModel({ ...model, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unlock Level</Label>
                <Select
                  value={model.unlock_level}
                  onValueChange={(value) => setModel({ ...model, unlock_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="research_contributor">Research Contributor Only</SelectItem>
                    <SelectItem value="request_only">On Request Only</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audience (comma-separated)</Label>
                <Input
                  value={model.audience.join(', ')}
                  onChange={(e) => updateArrayField('audience', e.target.value)}
                  placeholder="lawyer, partner, MBD"
                />
              </div>

              <div className="space-y-2">
                <Label>Search Tags (comma-separated)</Label>
                <Input
                  value={model.tags.join(', ')}
                  onChange={(e) => updateArrayField('tags', e.target.value)}
                  placeholder="marketing, strategy, growth"
                />
              </div>

              <div className="space-y-2">
                <Label>Outcomes (comma-separated)</Label>
                <Input
                  value={model.outcomes.join(', ')}
                  onChange={(e) => updateArrayField('outcomes', e.target.value)}
                  placeholder="Increased visibility, Better engagement"
                />
              </div>

              <div className="space-y-2">
                <Label>Suggested Actions (comma-separated)</Label>
                <Input
                  value={model.suggested_actions.join(', ')}
                  onChange={(e) => updateArrayField('suggested_actions', e.target.value)}
                  placeholder="Share with team, Schedule review"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured</Label>
                  <p className="text-sm text-muted-foreground">Show on home page</p>
                </div>
                <Switch
                  checked={model.featured}
                  onCheckedChange={(checked) => setModel({ ...model, featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notify Users
                  </Label>
                  <p className="text-sm text-muted-foreground">Send notification to all users on save</p>
                </div>
                <Switch
                  checked={notifyUsers}
                  onCheckedChange={setNotifyUsers}
                />
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

                {/* Topics */}
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
                        : 'No active topics found. Create topics first.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Steps</CardTitle>
              <Button size="sm" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {model.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No steps yet. Click "Add Step" to create one.
                </p>
              ) : (
                model.steps.map((step, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-muted/30 space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Step {index + 1}</span>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(index, { title: e.target.value })}
                          placeholder="Step title"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Instruction</Label>
                        <Textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(index, { instruction: e.target.value })}
                          placeholder="Instructions for this step"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/models')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : isNew ? 'Create Model' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Model"
        description="Are you sure you want to delete this model? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
