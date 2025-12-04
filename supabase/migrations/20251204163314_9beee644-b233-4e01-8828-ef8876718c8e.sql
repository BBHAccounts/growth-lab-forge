-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all notifications (for sending announcements)
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'welcome',
    'Welcome to Growth Lab! 🎉',
    'Get started by exploring our models and resources to accelerate your growth journey.',
    '/models'
  );
  RETURN NEW;
END;
$$;

-- Trigger welcome notification after profile creation
CREATE TRIGGER on_profile_created_welcome
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_welcome_notification();

-- Function to notify all users about new content
CREATE OR REPLACE FUNCTION public.notify_all_users(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT,
  p_reference_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  SELECT 
    p.user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_reference_id
  FROM public.profiles p;
END;
$$;

-- Trigger for new models
CREATE OR REPLACE FUNCTION public.notify_new_model()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    PERFORM public.notify_all_users(
      'new_model',
      'New Model Available: ' || NEW.name,
      COALESCE(NEW.short_description, 'Check out our latest model!'),
      '/models/' || COALESCE(NEW.slug, NEW.id::text),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_model_published
AFTER INSERT OR UPDATE ON public.models
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_model();

-- Trigger for new vendors
CREATE OR REPLACE FUNCTION public.notify_new_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_all_users(
    'new_vendor',
    'New Vendor Added: ' || NEW.name,
    COALESCE(NEW.description, 'Discover a new martech vendor!'),
    '/martech',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vendor_created
AFTER INSERT ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_vendor();

-- Trigger for new research studies
CREATE OR REPLACE FUNCTION public.notify_new_research()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active = true AND (OLD IS NULL OR OLD.active != true) THEN
    PERFORM public.notify_all_users(
      'new_research',
      'New Research Study: ' || NEW.title,
      COALESCE(NEW.description, 'Participate in our latest research!'),
      '/research/' || COALESCE(NEW.slug, NEW.id::text),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_research_published
AFTER INSERT OR UPDATE ON public.research_studies
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_research();

-- Trigger for new resources (insights)
CREATE OR REPLACE FUNCTION public.notify_new_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    PERFORM public.notify_all_users(
      'new_resource',
      'New Insight: ' || NEW.title,
      COALESCE(NEW.description, 'Check out our latest insight!'),
      '/insights',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_resource_published
AFTER INSERT OR UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_resource();

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);