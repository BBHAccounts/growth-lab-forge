-- Create topic_categories table
CREATE TABLE public.topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for key lookups
CREATE INDEX idx_topic_categories_key ON public.topic_categories(key);

-- Enable RLS
ALTER TABLE public.topic_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage topic_categories" ON public.topic_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view topic_categories" ON public.topic_categories
  FOR SELECT USING (true);

-- Auto-update trigger for updated_at
CREATE TRIGGER update_topic_categories_updated_at
  BEFORE UPDATE ON public.topic_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to topics table
ALTER TABLE public.topics 
  ADD COLUMN IF NOT EXISTS key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category_key TEXT,
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_for TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_topics_key ON public.topics(key);
CREATE INDEX IF NOT EXISTS idx_topics_category_key ON public.topics(category_key);

-- Add foreign key constraint after topic_categories table exists
ALTER TABLE public.topics 
  ADD CONSTRAINT fk_topics_category_key 
  FOREIGN KEY (category_key) REFERENCES public.topic_categories(key);