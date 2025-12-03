-- Create model_categories table (similar to martech_categories for vendors)
CREATE TABLE public.model_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.model_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view model categories" ON public.model_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage model categories" ON public.model_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create model_category_links junction (model to category)
CREATE TABLE public.model_category_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.model_categories(id) ON DELETE CASCADE,
  UNIQUE(model_id, category_id)
);

ALTER TABLE public.model_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view model_category_links" ON public.model_category_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage model_category_links" ON public.model_category_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create topic_model_categories junction (topic to model_category)
CREATE TABLE public.topic_model_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.model_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, category_id)
);

ALTER TABLE public.topic_model_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_model_categories" ON public.topic_model_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage topic_model_categories" ON public.topic_model_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create topic_vendor_categories junction (topic to martech_category)
CREATE TABLE public.topic_vendor_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.martech_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, category_id)
);

ALTER TABLE public.topic_vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_vendor_categories" ON public.topic_vendor_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage topic_vendor_categories" ON public.topic_vendor_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop old direct junction tables
DROP TABLE IF EXISTS public.topic_models;
DROP TABLE IF EXISTS public.topic_vendors;
DROP TABLE IF EXISTS public.topic_research;