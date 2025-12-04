-- Create resource_topics table to link resources to topics
CREATE TABLE public.resource_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, topic_id)
);

-- Create resource_topic_categories table to link resources to topic categories
CREATE TABLE public.resource_topic_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  topic_category_id UUID NOT NULL REFERENCES public.topic_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, topic_category_id)
);

-- Create vendor_topics table to link vendors to topics
CREATE TABLE public.vendor_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, topic_id)
);

-- Create vendor_topic_categories table to link vendors to topic categories
CREATE TABLE public.vendor_topic_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  topic_category_id UUID NOT NULL REFERENCES public.topic_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, topic_category_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.resource_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_topic_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_topic_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for resource_topics
CREATE POLICY "Anyone can view resource_topics" ON public.resource_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage resource_topics" ON public.resource_topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for resource_topic_categories
CREATE POLICY "Anyone can view resource_topic_categories" ON public.resource_topic_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage resource_topic_categories" ON public.resource_topic_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for vendor_topics
CREATE POLICY "Anyone can view vendor_topics" ON public.vendor_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage vendor_topics" ON public.vendor_topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for vendor_topic_categories
CREATE POLICY "Anyone can view vendor_topic_categories" ON public.vendor_topic_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage vendor_topic_categories" ON public.vendor_topic_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));