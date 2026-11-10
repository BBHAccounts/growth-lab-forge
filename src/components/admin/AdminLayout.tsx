import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ClipboardList, Users, Wrench, Settings } from "lucide-react";
const items = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
  { label: "Book programmes", to: "/admin/programs", icon: ClipboardList },
  { label: "Participants", to: "/admin/users", icon: Users },
  { label: "Tools and chapters", to: "/admin/models", icon: Wrench },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];
export function AdminLayout({ children }: { children: ReactNode }) {
  return <BookLayout><div className="max-w-7xl mx-auto w-full lg:flex"><aside className="lg:w-60 shrink-0 px-6 py-6 border-b lg:border-b-0 lg:border-r border-border"><p className="book-eyebrow mb-4">Administration</p><nav aria-label="Admin navigation" className="flex overflow-x-auto gap-2 lg:flex-col">{items.map(item => <Button key={item.to} asChild variant="ghost" className="justify-start shrink-0"><NavLink to={item.to} end={item.to === "/admin"}><item.icon className="h-4 w-4" />{item.label}</NavLink></Button>)}</nav></aside><div className="min-w-0 flex-1 p-6 lg:p-8">{children}</div></div></BookLayout>;
}
