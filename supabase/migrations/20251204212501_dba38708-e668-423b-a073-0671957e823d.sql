-- Create table to track when users read/click resources
CREATE TABLE public.user_resource_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_user_resource_views_user_id ON public.user_resource_views(user_id);
CREATE INDEX idx_user_resource_views_viewed_at ON public.user_resource_views(user_id, viewed_at DESC);

-- Enable RLS
ALTER TABLE public.user_resource_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own resource views
CREATE POLICY "Users can view their own resource views"
ON public.user_resource_views
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own resource views
CREATE POLICY "Users can insert their own resource views"
ON public.user_resource_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all resource views
CREATE POLICY "Admins can view all resource views"
ON public.user_resource_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));