-- Create direct topic-to-model junction table
CREATE TABLE public.topic_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, model_id)
);

-- Enable RLS
ALTER TABLE public.topic_models ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view topic_models" 
ON public.topic_models 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage topic_models" 
ON public.topic_models 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));