import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookModelBar({ onBack }: { onBack?: () => Promise<boolean | void> }) {
  return <div className="theme-book"><div className="bg-primary text-primary-foreground px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
    <span>Part of Beyond the Book</span>
    <Button variant="ghost" asChild className="rounded-full min-h-11 text-primary-foreground hover:text-primary hover:bg-primary-foreground"><Link to="/book" onClick={onBack ? async e => {
      e.preventDefault();
      const saved = await onBack();
      if (saved !== false) window.location.assign("/book");
    } : undefined}><ArrowLeft className="h-4 w-4" />Back to your path</Link></Button>
  </div></div>;
}