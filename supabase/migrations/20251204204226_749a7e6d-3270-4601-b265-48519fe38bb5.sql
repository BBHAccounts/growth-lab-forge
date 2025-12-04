-- Create research_study_topic_categories linking table
CREATE TABLE public.research_study_topic_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_id UUID NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
  topic_category_id UUID NOT NULL REFERENCES topic_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(study_id, topic_category_id)
);

-- Enable RLS
ALTER TABLE public.research_study_topic_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage research_study_topic_categories"
  ON public.research_study_topic_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view research_study_topic_categories"
  ON public.research_study_topic_categories
  FOR SELECT
  USING (true);