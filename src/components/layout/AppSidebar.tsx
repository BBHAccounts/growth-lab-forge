import { Home, BookOpen, FlaskConical, Map, Dice5, Info, User, LogOut, Users, Calendar } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Models", url: "/models", icon: BookOpen },
  { title: "Research Lab", url: "/research", icon: FlaskConical },
  { title: "Martech Map", url: "/martech", icon: Map },
  { title: "Expert Network", url: "/expert-network", icon: Users, comingSoon: true },
  { title: "Event Overview", url: "/events", icon: Calendar, comingSoon: true },
  { title: "Game of Life", url: "/game-of-life", icon: Dice5, locked: true },
];

const secondaryNavItems = [
  { title: "About BBH", url: "/about", icon: Info },
  { title: "My Account", url: "/account", icon: User },
];

export function AppSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
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
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={item.locked || item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {item.locked ? (
                      <div className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs bg-sidebar-accent px-2 py-0.5 rounded">🔒</span>
                      </div>
                    ) : item.comingSoon ? (
                      <div className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Soon</span>
                      </div>
                    ) : (
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          © 2024 Beyond Billable Hours
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
