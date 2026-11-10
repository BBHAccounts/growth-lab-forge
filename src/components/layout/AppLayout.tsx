import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { NotificationPopup } from "@/components/NotificationPopup";
import { useBookAudience } from "@/hooks/use-book-audience";
import { useQuery } from "@tanstack/react-query";
import { canAccessBookModel } from "@/lib/book-api";
import { BookModelBar } from "@/components/book/BookModelBar";

interface AppLayoutProps {
  children: ReactNode;
  onBookBack?: () => Promise<boolean | void>;
}
export function AppLayout({
  children, onBookBack
}: AppLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const audience = useBookAudience();
  const location = useLocation();
  const modelId = location.pathname.match(/^\/models\/([^/]+)(?:\/workspace)?$/)?.[1];
  const bookAccess = useQuery({ queryKey: ["book-model-access", user?.id, modelId, audience.member], enabled: Boolean(user && modelId && audience.member), queryFn: () => modelId ? canAccessBookModel(modelId) : false });
  const [searchParams] = useSearchParams();

  // Initialize search from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/martech?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  if (loading || audience.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  if (!user) {
    return null;
  }
  if (audience.error) return <p role="alert" className="p-6">We could not load your account. Please refresh and try again.</p>;
  const bar = bookAccess.data === true ? <BookModelBar onBack={onBookBack} /> : null;
  if (audience.focused) return <div className="min-h-screen bg-background"><main>{bar}{children}</main></div>;
  const initials = user.email?.slice(0, 2).toUpperCase() || "U";
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar bookMember={audience.member} />
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="lg:hidden" />
              <form onSubmit={handleSearch} className="relative hidden md:block flex-1 max-w-xl">
                
                
              </form>
            </div>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate("/account")}>
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {bar}
            {children}
          </main>
        </div>
      </div>
      <NotificationPopup />
    </SidebarProvider>;
}