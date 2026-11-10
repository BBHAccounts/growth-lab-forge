import { Navigate } from "react-router-dom";
import { useBookEntry } from "@/hooks/use-book-entry";
import { bookRootDestination } from "@/lib/book-routing";

export function BookRootEntry() {
  const state = useBookEntry();
  if (state.loading) return <div role="status" aria-label="Loading your account" className="min-h-screen bg-background flex items-center justify-center"><div className="h-12 w-12 rounded-full bg-muted animate-pulse" /></div>;
  if (state.error) return <p role="alert" className="p-8">{state.error}</p>;
  return <Navigate to={bookRootDestination(state.member, false)} replace />;
}