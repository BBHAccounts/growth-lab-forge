import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bookJoinLink, generateBookJoinCode } from "@/lib/book-admin";
import { useToast } from "@/hooks/use-toast";

export function BookProgramSettings({ code, onCode, onWeeklyDates, modelCount }: { code: string; onCode: (value: string) => void; onWeeklyDates: (date: Date) => void; modelCount: number }) {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(bookJoinLink(code)); toast({ title: "Join link copied" }); }
    catch { toast({ title: "Could not copy the link", variant: "destructive" }); }
  };
  return <div className="space-y-4">
    <div className="space-y-2"><Label htmlFor="join_code">Join code</Label><div className="flex flex-wrap gap-2"><Input id="join_code" value={code} onChange={e => onCode(e.target.value.toUpperCase())} className="sm:max-w-xs" /><Button variant="outline" onClick={() => onCode(generateBookJoinCode())}><RefreshCw className="h-4 w-4 mr-2" />Generate</Button><Button variant="outline" disabled={!code.trim()} onClick={copy}><Copy className="h-4 w-4 mr-2" />Copy join link</Button></div></div>
    <div className="space-y-2"><Label>Chapter 1 date</Label><div className="flex flex-wrap gap-2"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" className="min-w-56 justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "d MMMM yyyy") : "Choose start date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 pointer-events-auto" align="start"><Calendar mode="single" selected={date} onSelect={value => { setDate(value); setOpen(false); }} initialFocus className="pointer-events-auto" /></PopoverContent></Popover><Button variant="outline" disabled={!date || modelCount !== 15} onClick={() => { if (date) onWeeklyDates(date); }}>Set weekly dates</Button></div></div>
  </div>;
}