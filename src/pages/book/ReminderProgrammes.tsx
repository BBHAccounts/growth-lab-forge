import { Link } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { useReminderProgrammes } from "@/hooks/use-reminder-programmes";
import { useBookEntry } from "@/hooks/use-book-entry";
export default function ReminderProgrammes() {
  const entry = useBookEntry();
  const programmes = useReminderProgrammes();
  return <BookLayout><div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
    <header className="space-y-3"><p className="book-eyebrow">Your programmes</p><h1 className="book-display text-4xl">Reminder emails</h1></header>
    {entry.loading || programmes.isLoading ? <p role="status">Loading programmes...</p> : !entry.user ? <Button asChild><Link to="/auth">Sign in</Link></Button> : programmes.error ? <p role="alert">We could not load your programmes. Please try again.</p> : programmes.data?.length ? programmes.data.map(programme => <article key={programme.id} className="book-card flex flex-wrap justify-between items-center gap-6"><h2 className="book-display text-2xl">{programme.name}</h2><Button asChild><Link to={`/book/reminders/${programme.id}`}>Open reminders</Link></Button></article>) : <p>No reminder programmes are assigned to your account.</p>}
  </div></BookLayout>;
}
