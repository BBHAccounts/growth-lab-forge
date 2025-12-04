import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [notifyUsers, setNotifyUsers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('martech_categories')
          .select('*')
          .order('name');
        setCategories(categoriesData || []);

        if (!isNew && vendorId) {
          // Fetch vendor
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
            .single();

          if (vendorError) throw vendorError;
          setVendor({
            ...defaultVendor,
            ...vendorData,
            regions: vendorData.regions || [],
            firm_sizes: vendorData.firm_sizes || [],
          });

          // Fetch vendor categories
          const { data: vendorCats } = await supabase
            .from('vendor_categories')
            .select('category_id')
            .eq('vendor_id', vendorId);
          setSelectedCategories((vendorCats || []).map(vc => vc.category_id));
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

    try {
      const { data, error } = await supabase.functions.invoke('extract-vendor-metadata', {
        body: { 
          url: vendor.website_url,
          categories: categories,
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
        // Remove existing categories
        await supabase
          .from('vendor_categories')
          .delete()
          .eq('vendor_id', vendorIdToUse);

        // Add new categories
        if (selectedCategories.length > 0) {
          await supabase.from('vendor_categories').insert(
            selectedCategories.map((categoryId) => ({
              vendor_id: vendorIdToUse,
              category_id: categoryId,
            }))
          );
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

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
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
              <div className="flex items-center justify-between">
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
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/martech')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : isNew ? 'Create Vendor' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
