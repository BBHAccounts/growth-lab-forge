import { Home, BookOpen, FlaskConical, User, LogOut, Settings, Lightbulb, Award, GraduationCap } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Badge } from "@/components/ui/badge";
import glLogoDark from "@/assets/gl-logo-dark.svg";
const mainNavItems = [{
  title: "Programmes",
  url: "/programmes",
  icon: GraduationCap
}, {
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
  title: "Insights Hub",
  url: "/insights-hub",
  icon: Lightbulb
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
          <img src={glLogoDark} alt="Growth Lab" className="w-10 h-10 rounded-xl" />
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
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {profile && <div className="px-3 py-2 mb-2">
                {profile.research_contributor ? <Badge className="w-full justify-center gap-1.5 py-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-0">
                    <Award className="h-3 w-3" />
                    Research Contributor
                  </Badge> : <Badge variant="outline" className="w-full justify-center py-1 bg-muted text-muted-foreground border-border">
                    Member
                  </Badge>}
              </div>}
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
                    <img alt="BBH" src="/lovable-uploads/413e85a8-5a7d-49e8-b0ca-9800486157e7.png" className="h-5 w-5" />
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