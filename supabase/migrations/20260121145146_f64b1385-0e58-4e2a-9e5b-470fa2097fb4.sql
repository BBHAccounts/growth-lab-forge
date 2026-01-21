-- Create programs table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  allow_pdf_upload BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_participants table
CREATE TABLE public.program_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_responses table
CREATE TABLE public.program_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.program_participants(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  auto_saved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_uploads table
CREATE TABLE public.program_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.program_participants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_program_participants_access_code ON public.program_participants(access_code);
CREATE INDEX idx_program_participants_program_id ON public.program_participants(program_id);
CREATE INDEX idx_program_responses_participant_id ON public.program_responses(participant_id);

-- Enable RLS on all tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_uploads ENABLE ROW LEVEL SECURITY;

-- Programs policies
CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active programs" ON public.programs
  FOR SELECT USING (status = 'active');

-- Program participants policies
CREATE POLICY "Admins can manage program_participants" ON public.program_participants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can view their own record" ON public.program_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Participants can update their own record" ON public.program_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Program responses policies
CREATE POLICY "Admins can manage program_responses" ON public.program_responses
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can manage their own responses" ON public.program_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.program_participants pp
      WHERE pp.id = program_responses.participant_id
      AND pp.user_id = auth.uid()
    )
  );

-- Program uploads policies
CREATE POLICY "Admins can manage program_uploads" ON public.program_uploads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can manage their own uploads" ON public.program_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.program_participants pp
      WHERE pp.id = program_uploads.participant_id
      AND pp.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_responses_updated_at
  BEFORE UPDATE ON public.program_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for program files
INSERT INTO storage.buckets (id, name, public) VALUES ('program-files', 'program-files', false);

-- Storage policies for program files
CREATE POLICY "Admins can manage program files" ON storage.objects
  FOR ALL USING (bucket_id = 'program-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'program-files' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Participants can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'program-files'
    AND auth.uid() IS NOT NULL
  );