-- Create topics table for recommendation engine
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  -- Targeting fields
  recommended_seniority TEXT[] DEFAULT '{}',
  recommended_roles TEXT[] DEFAULT '{}',
  recommended_firm_sizes TEXT[] DEFAULT '{}',
  recommended_firm_types TEXT[] DEFAULT '{}',
  interest_area_keywords TEXT[] DEFAULT '{}',
  national_or_international TEXT[] DEFAULT '{}',
  min_growth_maturity INTEGER DEFAULT 1,
  max_growth_maturity INTEGER DEFAULT 5,
  min_data_maturity INTEGER DEFAULT 1,
  max_data_maturity INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table: topics to models
CREATE TABLE public.topic_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, model_id)
);

-- Junction table: topics to vendors
CREATE TABLE public.topic_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, vendor_id)
);

-- Junction table: topics to research studies
CREATE TABLE public.topic_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES public.research_studies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, research_id)
);

-- Add new profile fields for user characteristics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS interest_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS international_scope BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS growth_maturity_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS data_maturity_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS firm_type TEXT;

-- Enable RLS on topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active topics"
ON public.topics
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage topics"
ON public.topics
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on junction tables
ALTER TABLE public.topic_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_models"
ON public.topic_models
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage topic_models"
ON public.topic_models
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.topic_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_vendors"
ON public.topic_vendors
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage topic_vendors"
ON public.topic_vendors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.topic_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic_research"
ON public.topic_research
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage topic_research"
ON public.topic_research
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for topics updated_at
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();