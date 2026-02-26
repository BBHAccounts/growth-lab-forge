import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2 } from 'lucide-react';

interface Settings {
  site_name: string;
  tagline: string;
  welcome_modal_text: string;
  support_email: string;
  support_url: string;
  ai_assistant_global_prompt: string;
  enable_feed: boolean;
  enable_comments: boolean;
  enable_member_directory: boolean;
  enable_live_sessions: boolean;
}

const defaultSettings: Settings = {
  site_name: 'Growth Lab',
  tagline: 'Your Growth Partner',
  welcome_modal_text: 'Welcome to Growth Lab!',
  support_email: 'support@bbh.com',
  support_url: 'https://bbh.com/contact',
  ai_assistant_global_prompt: '',
  enable_feed: false,
  enable_comments: false,
  enable_member_directory: false,
  enable_live_sessions: false,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value');

        if (error) throw error;

        const settingsMap: Partial<Settings> = {};
        (data || []).forEach((item) => {
          const key = item.key as keyof Settings;
          try {
            const value = typeof item.value === 'string' 
              ? JSON.parse(item.value) 
              : item.value;
            (settingsMap as Record<string, unknown>)[key] = value;
          } catch {
            (settingsMap as Record<string, unknown>)[key] = item.value;
          }
        });

        setSettings({ ...defaultSettings, ...settingsMap });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert(update, { onConflict: 'key' });
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Platform configuration</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    placeholder="Growth Lab"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    placeholder="Your Growth Partner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Welcome Modal Text</Label>
                <Textarea
                  value={settings.welcome_modal_text}
                  onChange={(e) => setSettings({ ...settings, welcome_modal_text: e.target.value })}
                  placeholder="Welcome message for new users"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Support Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support URL</Label>
                  <Input
                    value={settings.support_url}
                    onChange={(e) => setSettings({ ...settings, support_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features (for future use)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Community Feed</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable activity feed for the community
                  </p>
                </div>
                <Switch
                  checked={settings.enable_feed}
                  onCheckedChange={(checked) => setSettings({ ...settings, enable_feed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to comment on models and content
                  </p>
                </div>
                <Switch
                  checked={settings.enable_comments}
                  onCheckedChange={(checked) => setSettings({ ...settings, enable_comments: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Member Directory</Label>
                  <p className="text-sm text-muted-foreground">
                    Show a directory of platform members
                  </p>
                </div>
                <Switch
                  checked={settings.enable_member_directory}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enable_member_directory: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Live Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable live webinar and session features
                  </p>
                </div>
                <Switch
                  checked={settings.enable_live_sessions}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enable_live_sessions: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
