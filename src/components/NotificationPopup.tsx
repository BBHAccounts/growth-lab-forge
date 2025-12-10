import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface PopupNotification {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  type: string;
}

export function NotificationPopup() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<PopupNotification | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchPopupNotification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch unread popup notifications (types ending with _popup or welcome with popup setting)
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, link, type')
        .eq('user_id', user.id)
        .eq('read', false)
        .or('type.like.%_popup,type.eq.welcome_popup')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching popup notification:', error);
        return;
      }

      if (data && data.length > 0) {
        setNotification(data[0]);
        setVisible(true);
      }
    };

    fetchPopupNotification();

    // Listen for realtime notifications
    const channel = supabase
      .channel('popup-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as any;
          if (newNotification.type?.includes('_popup') || newNotification.type === 'welcome_popup') {
            setNotification({
              id: newNotification.id,
              title: newNotification.title,
              message: newNotification.message,
              link: newNotification.link,
              type: newNotification.type,
            });
            setVisible(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = async () => {
    if (!notification) return;

    // Mark as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    setVisible(false);
    setNotification(null);
  };

  const handleAction = async () => {
    if (!notification) return;

    // Mark as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    if (notification.link) {
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        navigate(notification.link);
      }
    }

    setVisible(false);
    setNotification(null);
  };

  if (!visible || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {notification.title}
            </h3>
            {notification.message && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {notification.message.replace(/\\n/g, '\n')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
          {notification.link && (
            <Button onClick={handleAction}>
              {notification.link.startsWith('http') ? (
                <>
                  Open Link
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Go There'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
