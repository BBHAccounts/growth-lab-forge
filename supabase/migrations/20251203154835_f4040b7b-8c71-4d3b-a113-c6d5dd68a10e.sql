-- Add missing columns to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS template_urls jsonb DEFAULT '[]'::jsonb;

-- Add missing columns to research_studies table
ALTER TABLE public.research_studies ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.research_studies ADD COLUMN IF NOT EXISTS estimated_time integer;
ALTER TABLE public.research_studies ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.research_studies ADD COLUMN IF NOT EXISTS target_audience_tags text[] DEFAULT '{}'::text[];

-- Add is_client to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_client boolean DEFAULT false;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_settings
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create user_model_access table for granular access control
CREATE TABLE IF NOT EXISTS public.user_model_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  access_type text NOT NULL DEFAULT 'granted', -- 'granted' or 'revoked'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, model_id)
);

-- Enable RLS on user_model_access
ALTER TABLE public.user_model_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_model_access
CREATE POLICY "Users can view their own model access" ON public.user_model_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all model access" ON public.user_model_access
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('site_name', '"Growth Lab"'),
  ('tagline', '"Your Growth Partner"'),
  ('welcome_modal_text', '"Welcome to Growth Lab! Explore our tools and resources to accelerate your firm''s growth."'),
  ('support_email', '"support@bbh.com"'),
  ('support_url', '"https://bbh.com/contact"'),
  ('enable_feed', 'false'),
  ('enable_comments', 'false'),
  ('enable_member_directory', 'false'),
  ('enable_live_sessions', 'false')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for platform_settings updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();