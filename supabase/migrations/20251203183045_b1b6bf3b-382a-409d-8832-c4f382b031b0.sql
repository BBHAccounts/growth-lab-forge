-- Add access_level column to resources table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'all';

-- Update models table to use consistent access_level naming
-- The existing unlock_level column can serve this purpose, but let's add a clearer column
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'all';

-- Add comment for documentation
COMMENT ON COLUMN public.resources.access_level IS 'Access level: all, research_contributor, request_only';
COMMENT ON COLUMN public.models.access_level IS 'Access level: all, research_contributor, request_only';