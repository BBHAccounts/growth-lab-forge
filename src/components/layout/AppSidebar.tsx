import { Home, BookOpen, FlaskConical, Map, User, LogOut, Users, Settings, Lightbulb, Award } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Badge } from "@/components/ui/badge";
import bbhLogo from "@/assets/bbh-logo.jpg";
const mainNavItems = [{
  title: "Home",
  url: "/",
  icon: Home
}, {
  title: "Toolbox",
  url: "/models",
  icon: BookOpen
}, {
  title: "Research Lab",
  url: "/research",
  icon: FlaskConical
}, {
  title: "Martech Map",
  url: "/martech",
  icon: Map
}, {
  title: "Insights Hub",
  url: "/insights-hub",
  icon: Lightbulb
}, {
  title: "Expert Network",
  url: "/expert-network",
  icon: Users,
  comingSoon: true
}];
const secondaryNavItems = [{
  title: "My Account",
  url: "/account",
  icon: User
}];
export function AppSidebar() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    isAdmin
  } = useAdmin();
  const {
    profile
  } = useProfile();
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate("/auth");
    }
  };
  return <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-sm">
            <span className="text-secondary-foreground font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">Growth Lab</h1>
            <p className="text-xs text-muted-foreground">by Beyond Billable Hours</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}>
                    {item.comingSoon ? <div className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Soon</span>
                      </div> : <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>}
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-3 py-2 mb-2">
              {profile?.research_contributor ? (
                <Badge variant="default" className="w-full justify-center gap-1.5 py-1">
                  <Award className="h-3 w-3" />
                  Research Contributor
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-full justify-center py-1">
                  Member
                </Badge>
              )}
            </div>
            <SidebarMenu>
              {isAdmin && <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                      <Settings className="h-5 w-5" />
                      <span>Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/about" className={({
                isActive
              }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                    <img src={bbhLogo} alt="BBH" className="h-5 w-5 rounded-sm object-cover" />
                    <span>About BBH</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {secondaryNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer">
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">© 2025 Beyond Billable Hours</p>
      </SidebarFooter>
    </Sidebar>;
}