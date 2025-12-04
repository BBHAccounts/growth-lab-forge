import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Send, Bell, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface WelcomeNotificationSettings {
  title: string;
  message: string;
  link: string;
  showAsPopup: boolean;
}

const defaultWelcomeSettings: WelcomeNotificationSettings = {
  title: 'Welcome to Growth Lab! 🎉',
  message: 'Get started by exploring our models and resources to accelerate your growth journey.',
  link: '/models',
  showAsPopup: false,
};

export default function AdminNotifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Welcome notification settings
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeNotificationSettings>(defaultWelcomeSettings);
  
  // Announcement state
  const [announcement, setAnnouncement] = useState({
    type: 'admin_message',
    title: '',
    message: '',
    link: '',
    showAsPopup: false,
  });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['welcome_notification_title', 'welcome_notification_message', 'welcome_notification_link', 'welcome_notification_show_as_popup']);

        if (error) throw error;

        const settingsMap: Record<string, string | boolean> = {};
        (data || []).forEach((item) => {
          const keyMap: Record<string, keyof WelcomeNotificationSettings> = {
            welcome_notification_title: 'title',
            welcome_notification_message: 'message',
            welcome_notification_link: 'link',
            welcome_notification_show_as_popup: 'showAsPopup',
          };
          const mappedKey = keyMap[item.key];
          if (mappedKey) {
            try {
              const value = typeof item.value === 'string' 
                ? JSON.parse(item.value) 
                : item.value;
              settingsMap[mappedKey] = value;
            } catch {
              settingsMap[mappedKey] = item.value as string;
            }
          }
        });

        setWelcomeSettings({ 
          ...defaultWelcomeSettings, 
          title: (settingsMap.title as string) || defaultWelcomeSettings.title,
          message: (settingsMap.message as string) || defaultWelcomeSettings.message,
          link: (settingsMap.link as string) || defaultWelcomeSettings.link,
          showAsPopup: settingsMap.showAsPopup === true,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveWelcomeSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'welcome_notification_title', value: JSON.stringify(welcomeSettings.title) },
        { key: 'welcome_notification_message', value: JSON.stringify(welcomeSettings.message) },
        { key: 'welcome_notification_link', value: JSON.stringify(welcomeSettings.link) },
        { key: 'welcome_notification_show_as_popup', value: JSON.stringify(welcomeSettings.showAsPopup) },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert(update, { onConflict: 'key' });
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Welcome notification template saved' });
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

  const handleSendAnnouncement = async () => {
    if (!announcement.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSendingAnnouncement(true);
    try {
      const { error } = await supabase.rpc('notify_all_users', {
        p_type: announcement.showAsPopup ? `${announcement.type}_popup` : announcement.type,
        p_title: announcement.title,
        p_message: announcement.message || null,
        p_link: announcement.link || null,
        p_reference_id: null,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Announcement sent to all users' });
      setAnnouncement({ type: 'admin_message', title: '', message: '', link: '', showAsPopup: false });
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to send announcement',
        variant: 'destructive',
      });
    } finally {
      setSendingAnnouncement(false);
      setShowConfirmDialog(false);
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
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage notification templates and send announcements</p>
        </div>

        <div className="grid gap-6">
          {/* Welcome Notification Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Welcome Notification Template
              </CardTitle>
              <CardDescription>
                Customize the notification sent to new users when they sign up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={welcomeSettings.title}
                  onChange={(e) => setWelcomeSettings({ ...welcomeSettings, title: e.target.value })}
                  placeholder="Welcome to Growth Lab! 🎉"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={welcomeSettings.message}
                  onChange={(e) => setWelcomeSettings({ ...welcomeSettings, message: e.target.value })}
                  placeholder="Get started by exploring..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Link</Label>
                <Input
                  value={welcomeSettings.link}
                  onChange={(e) => setWelcomeSettings({ ...welcomeSettings, link: e.target.value })}
                  placeholder="/models"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="welcome-popup">Show as Pop-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Display as a dismissible pop-up in addition to the notification menu
                  </p>
                </div>
                <Switch
                  id="welcome-popup"
                  checked={welcomeSettings.showAsPopup}
                  onCheckedChange={(checked) => setWelcomeSettings({ ...welcomeSettings, showAsPopup: checked })}
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
                <div className="flex items-start gap-3 p-3 rounded-md bg-background border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{welcomeSettings.title || 'Title'}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{welcomeSettings.message || 'Message'}</p>
                    {welcomeSettings.link && (
                      <p className="text-xs text-primary mt-1">{welcomeSettings.link}</p>
                    )}
                  </div>
                </div>
                {welcomeSettings.showAsPopup && (
                  <p className="text-xs text-muted-foreground">+ Will also show as a dismissible pop-up</p>
                )}
              </div>

              <Button onClick={handleSaveWelcomeSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </CardContent>
          </Card>

          {/* Send Announcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Send Announcement
              </CardTitle>
              <CardDescription>Send a notification to all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select
                    value={announcement.type}
                    onValueChange={(value) => setAnnouncement({ ...announcement, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_message">Admin Message</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="update">Platform Update</SelectItem>
                      <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link (optional)</Label>
                  <Input
                    value={announcement.link}
                    onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                    placeholder="/models or https://..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </div>

              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="announcement-popup">Show as Pop-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Display as a dismissible pop-up in addition to the notification menu
                  </p>
                </div>
                <Switch
                  id="announcement-popup"
                  checked={announcement.showAsPopup}
                  onCheckedChange={(checked) => setAnnouncement({ ...announcement, showAsPopup: checked })}
                />
              </div>

              <Button 
                onClick={() => setShowConfirmDialog(true)} 
                disabled={sendingAnnouncement || !announcement.title.trim()}
                className="w-full md:w-auto"
              >
                {sendingAnnouncement ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {sendingAnnouncement ? 'Sending...' : 'Send to All Users'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Send Announcement?"
        description={`Are you sure you want to send "${announcement.title}" to all users? This action cannot be undone.`}
        confirmLabel="Yes, Send"
        cancelLabel="Cancel"
        onConfirm={handleSendAnnouncement}
      />
    </AdminLayout>
  );
}
