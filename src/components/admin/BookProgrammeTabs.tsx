import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BookProgrammeTabs({ programmeId }: { programmeId: string }) {
  return <nav aria-label="Programme tabs" className="flex flex-wrap gap-2 border-b border-border pb-4">
    {[["", "Programme"], ["/responses", "Progress"], ["/reminders", "Reminder emails"]].map(([suffix, label]) => <Button key={suffix} variant="ghost" asChild><NavLink to={`/admin/programs/${programmeId}${suffix}`} end className="aria-[current=page]:bg-secondary aria-[current=page]:font-bold">{label}</NavLink></Button>)}
  </nav>;
}