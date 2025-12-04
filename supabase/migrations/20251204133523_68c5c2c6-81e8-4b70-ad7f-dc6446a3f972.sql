-- Add owner_id column to models table
ALTER TABLE public.models 
ADD COLUMN owner_id uuid REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_models_owner_id ON public.models(owner_id);