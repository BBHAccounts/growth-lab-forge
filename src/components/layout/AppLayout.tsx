import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookLayout } from "@/components/book/BookLayout";
export function AppLayout({ children, onBookBack }: { children: ReactNode; onBookBack?: () => Promise<boolean | void> }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      if (!data.session) navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true });
      else setReady(true);
    });
    return () => { live = false; };
  }, [navigate, location.pathname]);
  return <BookLayout video={Boolean(onBookBack)} onBack={onBookBack}>{ready ? children : <div role="status" className="p-8" aria-label="Loading your account"><div className="h-40 rounded-xl bg-muted animate-pulse" /></div>}</BookLayout>;
}
