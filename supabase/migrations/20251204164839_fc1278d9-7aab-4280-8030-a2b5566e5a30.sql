-- Drop automatic notification triggers (notifications will be optional via admin forms)
DROP TRIGGER IF EXISTS notify_new_model_trigger ON public.models;
DROP TRIGGER IF EXISTS notify_new_vendor_trigger ON public.vendors;
DROP TRIGGER IF EXISTS notify_new_research_trigger ON public.research_studies;
DROP TRIGGER IF EXISTS notify_new_resource_trigger ON public.resources;

-- Keep the functions for manual use, and keep the welcome notification trigger