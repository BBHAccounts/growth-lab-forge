import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BookProgrammeTabs } from "@/components/admin/BookProgrammeTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { bookReminderEmails } from "@/content/bookReminderEmails";
import { reminderClipboard, reminderSenderKey, reminderVideoLink } from "@/lib/book-reminders";
import { useToast } from "@/hooks/use-toast";

export default function AdminProgramReminders() {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [programme, setProgramme] = useState<{ name: string; join_code: string | null } | null>(null);
  const [dates, setDates] = useState<Record<number, string | null>>({});
  const [sender, setSender] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    let live = true;
    try { setSender(localStorage.getItem(reminderSenderKey(programId)) ?? ""); } catch { setSender(""); }
    void (async () => {
      const [program, links] = await Promise.all([
        supabase.from("programs").select("name, join_code").eq("id", programId).eq("is_book", true).single(),
        supabase.from("program_models").select("order_index, deadline").eq("program_id", programId).order("order_index"),
      ]);
      if (!live) return;
      if (program.error || links.error) { setError("We could not load the reminder emails. Please try again."); return; }
      setProgramme(program.data);
      setDates(Object.fromEntries((links.data ?? []).map(row => [row.order_index, row.deadline])));
    })();
    return () => { live = false; };
  }, [programId]);
  const changeSender = (value: string) => {
    setSender(value);
    try { localStorage.setItem(reminderSenderKey(programId), value); } catch { toast({ title: "Your sender name cannot be remembered on this device", variant: "destructive" }); }
  };
  const copy = async (index: number, subjectOnly: boolean) => {
    const email = bookReminderEmails[index];
    if (!email || !programme?.join_code) return;
    try {
      if (subjectOnly) await navigator.clipboard.writeText(email.subject);
      else {
        const content = reminderClipboard(email, sender, programme.join_code);
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([content.html], { type: "text/html" }), "text/plain": new Blob([content.text], { type: "text/plain" }) })]);
        } else {
          await navigator.clipboard.writeText(content.text);
          toast({ title: "Email copied as plain text", description: "This browser does not support rich-text copying. The video link is included." });
          return;
        }
      }
      toast({ title: subjectOnly ? "Subject copied" : "Email copied" });
    } catch { toast({ title: "We could not copy to your clipboard", description: "Allow clipboard access and try again.", variant: "destructive" }); }
  };
  const download = async () => {
    if (!programme?.join_code) return;
    setExporting(true);
    try {
      const { reminderWordBlob } = await import("@/lib/book-reminders-word");
      const blob = await reminderWordBlob(sender, programme.join_code);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "Beyond-the-Book-reminder-emails.docx"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast({ title: "We could not prepare the Word document", variant: "destructive" }); }
    finally { setExporting(false); }
  };
  return <AdminLayout><div className="space-y-8">
    <Button variant="ghost" onClick={() => navigate(`/admin/programs/${programId}`)}><ArrowLeft className="h-4 w-4" />Back to programme</Button>
    <BookProgrammeTabs programmeId={programId} />
    <header className="space-y-3"><p className="book-eyebrow">{programme?.name || "Book programme"}</p><h1 className="book-display text-4xl">Reminder emails</h1></header>
    {error ? <p role="alert">{error}</p> : !programme ? <div role="status" aria-label="Loading reminder emails" className="h-48 bg-muted rounded-xl animate-pulse" /> : <>
      <div className="flex flex-col sm:flex-row sm:items-end gap-6"><div className="space-y-3 flex-1 min-w-0"><Label htmlFor="reminder-sender">Sender name or team</Label><Input id="reminder-sender" value={sender} onChange={e => changeSender(e.target.value)} /></div><Button disabled={exporting || !programme.join_code} onClick={download}>{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download all as Word</Button></div>
      {!programme.join_code && <p role="alert">Save a join code for this programme before copying or downloading emails.</p>}
      {Array.from({ length: 15 }, (_, i) => i + 1).map(chapter => <section key={chapter} className="space-y-6"><header className="space-y-3 pt-4"><p className="book-eyebrow">Chapter {chapter}</p><h2 className="book-display text-3xl">Chapter {chapter} reminders</h2><p className="text-sm">Send from: {dates[chapter] ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dates[chapter] as string)) : "Not scheduled"}</p></header>
        {bookReminderEmails.filter(email => Number(email.id.slice(0, -1)) === chapter).map(email => <article key={email.id} className="book-card bg-card space-y-6"><p className="book-eyebrow">{email.id}</p><h3 className="text-xl font-semibold leading-snug">{email.subject}</h3><div className="space-y-4 text-sm leading-relaxed"><p>Hi everyone,</p>{email.intro.map((text, i) => <p key={i}>{text}</p>)}<p>Watch the video: <a className="underline underline-offset-4" href={reminderVideoLink(email.id, programme.join_code ?? "")}>{email.title}</a></p><p>Put it into practice: {email.practice}</p>{email.closing.map((text, i) => <p key={i}>{text}</p>)}<p>Best wishes,<br />{sender || "[Sender name or team]"}</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!programme.join_code} onClick={() => void copy(bookReminderEmails.indexOf(email), true)}><Copy className="h-4 w-4" />Copy subject</Button><Button disabled={!programme.join_code} onClick={() => void copy(bookReminderEmails.indexOf(email), false)}><Copy className="h-4 w-4" />Copy email</Button></div></article>)}
      </section>)}
    </>}
  </div></AdminLayout>;
}