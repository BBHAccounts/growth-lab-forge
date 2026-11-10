import { type ReactNode } from "react";
import bbhWhite from "@/assets/bbh-logo-white.svg.asset.json";
import bbhColour from "@/assets/bbh-logo-colour.svg.asset.json";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, List, Wrench, NotebookPen, UserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBookEntry } from "@/hooks/use-book-entry";
import { useBookAudience } from "@/hooks/use-book-audience";
import { supabase } from "@/integrations/supabase/client";

export function BookLayout({ children, name = "", video = false, onBack }: { children: ReactNode; path?: boolean; name?: string; video?: boolean; onBack?: () => Promise<boolean | void> }) {
  const audience = useBookAudience();
  const entry = useBookEntry();
  const navigate = useNavigate();
  const back = async () => { if (onBack && await onBack() === false) return; navigate("/book"); };
  return <div className="min-h-screen bg-background text-foreground flex flex-col">
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
        <Link to="/book" className="flex items-center gap-3 min-w-0"><img src={bbhWhite.url} alt="Beyond Billable Hours" className="book-header-logo object-contain" /><span className="book-brand-name text-sm font-semibold">Beyond the Book</span></Link>
        <nav aria-label="Book navigation" className="hidden lg:flex items-center gap-1">
          {[["/book", "Path"], ["/book/chapters", "Chapters"], ["/book/library", "Model library"], ["/book/notes", "My notes"], ...(audience.admin ? [["/admin", "Admin"]] : [])].map(([to, label]) => <Button key={to} variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground hover:text-primary"><NavLink to={to} end={to === "/book" || to === "/admin"}>{label}</NavLink></Button>)}
        </nav>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Account menu" className="shrink-0 text-primary-foreground hover:bg-primary-foreground hover:text-primary"><UserRound className="h-5 w-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{entry.user && <DropdownMenuItem asChild><Link to="/account">{name || "My account"}</Link></DropdownMenuItem>}{audience.admin && <DropdownMenuItem asChild><Link to="/admin">Admin</Link></DropdownMenuItem>}{!entry.user && <DropdownMenuItem asChild><Link to="/auth">Sign in</Link></DropdownMenuItem>}{entry.user && <DropdownMenuItem onClick={async () => { const { error } = await supabase.auth.signOut(); if (!error) navigate("/book/join"); }}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
      </div>
    </header>
    <main className="flex-1 pb-20 lg:pb-0">{video && <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6"><Button variant="ghost" onClick={back}><ArrowLeft className="h-5 w-5" />Back to your path</Button></div>}{children}</main>
    <footer className="max-w-7xl w-full mx-auto px-6 lg:px-10 pt-8 pb-24 lg:pb-8 text-xs flex items-center gap-3"><img src={bbhColour.url} alt="Beyond Billable Hours" className="w-28 object-contain" /><span>A product of Beyond Billable Hours</span></footer>
    <nav aria-label="Book tabs" className="book-tabs lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border grid grid-cols-4">
      {[["/book", "This week", BookOpen], ["/book/chapters", "Chapters", List], ["/book/library", "Model library", Wrench], ["/book/notes", "My notes", NotebookPen]].map(([to, label, Icon]) => {
        const TabIcon = Icon as typeof BookOpen;
        return <Button key={String(to)} asChild variant="ghost" className="h-16 flex-col gap-1 text-xs"><NavLink to={String(to)} end><TabIcon className="h-5 w-5" strokeWidth={1.5} />{String(label)}</NavLink></Button>;
      })}
    </nav>
  </div>;
}
