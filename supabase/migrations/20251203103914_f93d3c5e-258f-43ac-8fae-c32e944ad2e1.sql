-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role_title TEXT,
  seniority TEXT,
  firm_name TEXT,
  firm_region TEXT,
  firm_size TEXT,
  practice_area TEXT,
  growth_priorities TEXT[],
  research_contributor BOOLEAN DEFAULT false,
  game_of_life_access BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create models table
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  emoji TEXT DEFAULT '📚',
  audience TEXT[] DEFAULT '{}',
  time_estimate TEXT,
  tags TEXT[] DEFAULT '{}',
  outcomes TEXT[] DEFAULT '{}',
  unlock_level TEXT DEFAULT 'registered',
  steps JSONB DEFAULT '[]',
  suggested_actions TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activated_models table (user progress)
CREATE TABLE public.activated_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
  progress JSONB DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, model_id)
);

-- Create martech_categories table
CREATE TABLE public.martech_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  regions TEXT[] DEFAULT '{}',
  firm_sizes TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_categories junction table
CREATE TABLE public.vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.martech_categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (vendor_id, category_id)
);

-- Create research_studies table
CREATE TABLE public.research_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🧪',
  questions JSONB DEFAULT '[]',
  reward_description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create research_responses table
CREATE TABLE public.research_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  study_id UUID REFERENCES public.research_studies(id) ON DELETE CASCADE NOT NULL,
  responses JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_id)
);

-- Create reactions table (likes on models, vendors, research)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activated_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.martech_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for models (public read, admin write)
CREATE POLICY "Anyone can view models" ON public.models
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage models" ON public.models
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activated_models
CREATE POLICY "Users can view their own activated models" ON public.activated_models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activated models" ON public.activated_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activated models" ON public.activated_models
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activated models" ON public.activated_models
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for martech (public read)
CREATE POLICY "Anyone can view martech categories" ON public.martech_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage martech categories" ON public.martech_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view vendors" ON public.vendors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view vendor categories" ON public.vendor_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vendor categories" ON public.vendor_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for research
CREATE POLICY "Anyone can view active research studies" ON public.research_studies
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage research studies" ON public.research_studies
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own research responses" ON public.research_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research responses" ON public.research_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research responses" ON public.research_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Users can view all reactions" ON public.reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activated_models_updated_at
  BEFORE UPDATE ON public.activated_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();