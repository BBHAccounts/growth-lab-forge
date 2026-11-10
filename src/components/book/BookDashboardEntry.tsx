import { Navigate } from "react-router-dom";
import { useBookAudience } from "@/hooks/use-book-audience";
import Index from "@/pages/Index";

export function BookDashboardEntry() {
  const audience = useBookAudience();
  if (audience.loading) return <div role="status" aria-label="Loading your account" className="min-h-screen bg-background flex items-center justify-center"><div className="h-12 w-12 rounded-lg bg-muted animate-pulse" /></div>;
  if (audience.error) return <p role="alert" className="p-6">We could not load your account. Please refresh and try again.</p>;
  return audience.focused ? <Navigate to="/book" replace /> : <Index />;
}