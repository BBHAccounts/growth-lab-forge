-- Create model_topic_categories table to link models to topic categories
CREATE TABLE public.model_topic_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  topic_category_id UUID NOT NULL REFERENCES public.topic_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model_id, topic_category_id)
);

-- Enable RLS
ALTER TABLE public.model_topic_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view model_topic_categories" ON public.model_topic_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage model_topic_categories" ON public.model_topic_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));