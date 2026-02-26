
-- Create program_models junction table
CREATE TABLE public.program_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  deadline timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(program_id, model_id)
);

-- Add sequential flag to programs
ALTER TABLE public.programs ADD COLUMN sequential boolean DEFAULT true;

-- Enable RLS
ALTER TABLE public.program_models ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage program_models"
  ON public.program_models FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view program_models"
  ON public.program_models FOR SELECT
  USING (true);

-- Migrate existing data: move programs.model_id to program_models
INSERT INTO public.program_models (program_id, model_id, order_index)
SELECT id, model_id, 0
FROM public.programs
WHERE model_id IS NOT NULL;
