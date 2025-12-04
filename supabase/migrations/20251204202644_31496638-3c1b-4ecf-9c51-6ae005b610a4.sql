-- Create martech_category_topic_categories table
CREATE TABLE public.martech_category_topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  martech_category_id UUID NOT NULL REFERENCES public.martech_categories(id) ON DELETE CASCADE,
  topic_category_id UUID NOT NULL REFERENCES public.topic_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(martech_category_id, topic_category_id)
);

-- Create martech_category_topics table
CREATE TABLE public.martech_category_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  martech_category_id UUID NOT NULL REFERENCES public.martech_categories(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(martech_category_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.martech_category_topic_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.martech_category_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for martech_category_topic_categories
CREATE POLICY "Admins can manage martech_category_topic_categories"
ON public.martech_category_topic_categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view martech_category_topic_categories"
ON public.martech_category_topic_categories
FOR SELECT
USING (true);

-- RLS policies for martech_category_topics
CREATE POLICY "Admins can manage martech_category_topics"
ON public.martech_category_topics
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view martech_category_topics"
ON public.martech_category_topics
FOR SELECT
USING (true);