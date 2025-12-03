-- Create resources table for articles, webinars, guides, etc.
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'article', -- article, webinar, guide, video, podcast
  url TEXT,
  emoji TEXT DEFAULT '📄',
  image_url TEXT,
  author TEXT,
  published_date DATE,
  estimated_time INTEGER, -- in minutes
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active resources" ON public.resources FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create resource_categories table (like model_categories)
CREATE TABLE public.resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resource categories" ON public.resource_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage resource categories" ON public.resource_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create resource_category_links junction (resource to category)
CREATE TABLE public.resource_category_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.resource_categories(id) ON DELETE CASCADE,
  UNIQUE(resource_id, category_id)
);

ALTER TABLE public.resource_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resource_category_links" ON public.resource_category_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage resource_category_links" ON public.resource_category_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create topic_resource_categories junction (topic to resource_category)
CREATE TABLE public.topic_resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.resource_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, category_id)
);

ALTER TABLE public.topic_resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_resource_categories" ON public.topic_resource_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage topic_resource_categories" ON public.topic_resource_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for resources
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();