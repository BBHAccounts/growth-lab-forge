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
import { ArrowLeft, Save, Trash2, Wand2, Loader2, ImageOff, ExternalLink, Upload, User, Sparkles, Bell } from 'lucide-react';

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
  access_level: string;
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
  access_level: 'all',
};

const RESOURCE_TYPES = [
  { value: 'article', label: 'Article', emoji: '📄' },
  { value: 'webinar', label: 'Webinar', emoji: '🎥' },
  { value: 'guide', label: 'Guide', emoji: '📘' },
  { value: 'video', label: 'Video', emoji: '▶️' },
  { value: 'podcast', label: 'Podcast', emoji: '🎙️' },
  { value: 'event', label: 'Event', emoji: '📅' },
];

export default function AdminResourceForm() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = resourceId === 'new';

  const [resource, setResource] = useState<Resource>(defaultResource);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<{ name: string; email: string; createdAt: string } | null>(null);
  const [notifyUsers, setNotifyUsers] = useState(false);

  const handleExtractMetadata = async () => {
    if (!resource.url) {
      toast({ title: 'Error', description: 'Please enter a URL first', variant: 'destructive' });
      return;
    }

    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-url-metadata', {
        body: { url: resource.url },
      });

      if (error) throw error;

      if (data) {
        setResource((prev) => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          author: data.author || prev.author,
          type: data.type || prev.type,
          emoji: RESOURCE_TYPES.find((t) => t.value === data.type)?.emoji || prev.emoji,
          estimated_time: data.estimated_time || prev.estimated_time,
          image_url: data.image_url || prev.image_url,
        }));
        toast({ title: 'Success', description: 'Metadata extracted successfully' });
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      toast({ title: 'Error', description: 'Failed to extract metadata', variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resource-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resource-images')
        .getPublicUrl(filePath);

      setResource((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleGenerateImage = async () => {
    if (!resource.title) {
      toast({ title: 'Error', description: 'Please enter a title first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insight-image', {
        body: { 
          title: resource.title, 
          description: resource.description,
          type: resource.type,
        },
      });

      if (error) throw error;

      if (data?.image_url) {
        setResource((prev) => ({ ...prev, image_url: data.image_url }));
        toast({ title: 'Success', description: 'AI image generated successfully' });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: 'Error', description: 'Failed to generate image', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

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
          access_level: resourceData.access_level || 'all',
        });

        // Fetch creator info if available
        if (resourceData.created_by) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', resourceData.created_by)
            .maybeSingle();

          if (profileData) {
            setCreatorInfo({
              name: profileData.full_name || 'Unknown',
              email: profileData.email || '',
              createdAt: resourceData.created_at,
            });
          }
        }

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
        access_level: resource.access_level,
      };

      if (isNew) {
        // Get current user for created_by
        const { data: { user } } = await supabase.auth.getUser();
        const insertData = user ? { ...resourceData, created_by: user.id } : resourceData;
        
        const { data, error } = await supabase.from('resources').insert([insertData]).select('id').single();
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

      // Send notification if toggle is on
      if (notifyUsers && resource.status === 'active') {
        await supabase.rpc('notify_all_users', {
          p_type: 'new_resource',
          p_title: `New Insight: ${resource.title}`,
          p_message: resource.description || 'Check out our latest insight!',
          p_link: '/insights-hub',
          p_reference_id: savedResourceId,
        });
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
              {creatorInfo && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>Added by {creatorInfo.name}</span>
                  {creatorInfo.email && <span className="text-muted-foreground/60">({creatorInfo.email})</span>}
                  <span>on {new Date(creatorInfo.createdAt).toLocaleDateString()}</span>
                </div>
              )}
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
                <div className="flex gap-2">
                  <Input
                    value={resource.url}
                    onChange={(e) => setResource({ ...resource, url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExtractMetadata}
                    disabled={extracting || !resource.url}
                  >
                    {extracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Auto-fill</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={resource.image_url}
                    onChange={(e) => setResource({ ...resource, image_url: e.target.value })}
                    placeholder="https://... (auto-filled, enter URL, upload, or generate)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading || generating}
                    title="Upload image"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={generating || uploading || !resource.title}
                    title="Generate AI image"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image or click <Sparkles className="w-3 h-3 inline" /> to generate one with AI based on the title
                </p>
                {resource.image_url ? (
                  <div className="mt-2 relative group">
                    <img 
                      src={resource.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-32 bg-muted rounded-md border flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageOff className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-xs">Image failed to load</p>
                      </div>
                    </div>
                    <a 
                      href={resource.image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="mt-2 w-full h-32 bg-muted/50 rounded-md border border-dashed flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ImageOff className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs">No image yet</p>
                    </div>
                  </div>
                )}
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

              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select
                  value={resource.access_level}
                  onValueChange={(value) => setResource({ ...resource, access_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="research_contributor">Research Contributors Only</SelectItem>
                    <SelectItem value="request_only">On Request Only</SelectItem>
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
