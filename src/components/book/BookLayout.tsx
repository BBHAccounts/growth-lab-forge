import { useEffect, type ReactNode } from "react";
import bbhLogo from "@/assets/bbh-logo.jpg";
import { NavLink } from "react-router-dom";
import { BookOpen, List, Wrench, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookLayout({ children, path = false, name = "" }: { children: ReactNode; path?: boolean; name?: string }) {
  useEffect(() => {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Raleway:wght@400;500;600;700&display=swap";
    document.head.appendChild(fonts);
    return () => fonts.remove();
  }, []);

  return <div className="theme-book min-h-screen bg-background text-foreground flex flex-col">
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between gap-6">
        {path ? <div><span className="book-display text-2xl lg:text-3xl">Beyond the Book</span><p className="hidden lg:block text-xs mt-2">The companion to Beyond Billable Hours</p></div> : <span className="text-sm font-semibold">Beyond Billable Hours</span>}
        {path && <nav aria-label="Book navigation" className="hidden lg:flex items-center gap-3">
          {[["/book", "Your path"], ["/book/tools", "Tools"], ["/book/notes", "My notes"]].map(([to, label]) => <Button key={to} variant="ghost" asChild className="rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary"><NavLink to={to} end>{label}</NavLink></Button>)}
          <span className="h-11 w-11 rounded-full border border-primary-foreground/40 flex items-center justify-center text-sm" aria-label={name || "Your account"}>{name.split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join("").toUpperCase() || "B"}</span>
        </nav>}
      </div>
    </header>
    <main className={`flex-1 ${path ? "pb-20 lg:pb-0" : ""}`}>{children}</main>
    <footer className="max-w-5xl w-full mx-auto px-6 md:px-10 py-8 text-xs font-medium text-foreground flex items-center gap-3">
      <img src={bbhLogo} alt="Beyond Billable Hours" className="w-8 h-8 object-contain" />
      <span>A product of Beyond Billable Hours</span>
    </footer>
    {path && <nav aria-label="Book tabs" className="book-tabs lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border grid grid-cols-4">
      {[["/book", "This week", BookOpen], ["/book/chapters", "Chapters", List], ["/book/tools", "Tools", Wrench], ["/book/notes", "My notes", NotebookPen]].map(([to, label, Icon]) => {
        const TabIcon = Icon as typeof BookOpen;
        return <Button key={String(to)} variant="ghost" asChild className="h-16 rounded-none px-1"><NavLink to={String(to)} end className={({ isActive }) => `flex flex-col gap-1 text-[11px] ${isActive ? "bg-secondary font-bold" : "font-medium"}`}><TabIcon className="h-5 w-5" strokeWidth={1.5} />{String(label)}</NavLink></Button>;
      })}
    </nav>}
  </div>;
}