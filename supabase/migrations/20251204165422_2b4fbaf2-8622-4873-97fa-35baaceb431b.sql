-- Update the welcome notification trigger to read from platform_settings
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_title text;
  v_message text;
  v_link text;
  v_setting_value jsonb;
BEGIN
  -- Get title from settings or use default
  SELECT value INTO v_setting_value FROM public.platform_settings WHERE key = 'welcome_notification_title';
  v_title := COALESCE(
    TRIM(BOTH '"' FROM v_setting_value::text),
    'Welcome to Growth Lab! 🎉'
  );
  
  -- Get message from settings or use default
  SELECT value INTO v_setting_value FROM public.platform_settings WHERE key = 'welcome_notification_message';
  v_message := COALESCE(
    TRIM(BOTH '"' FROM v_setting_value::text),
    'Get started by exploring our models and resources to accelerate your growth journey.'
  );
  
  -- Get link from settings or use default
  SELECT value INTO v_setting_value FROM public.platform_settings WHERE key = 'welcome_notification_link';
  v_link := COALESCE(
    TRIM(BOTH '"' FROM v_setting_value::text),
    '/models'
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'welcome',
    v_title,
    v_message,
    v_link
  );
  RETURN NEW;
END;
$function$;