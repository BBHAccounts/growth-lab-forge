-- Add created_by column to resources table
ALTER TABLE public.resources 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_resources_created_by ON public.resources(created_by);