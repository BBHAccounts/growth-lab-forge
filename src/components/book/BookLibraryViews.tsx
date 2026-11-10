import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { BookPathData } from "@/hooks/use-book-path";
import { chapterTitle } from "@/lib/book-path";
import { bookNotesText, savedBookNotes } from "@/lib/book-reader";

type Tool = { id: string; name: string; short_description: string | null; time_estimate: string | null; tags: string[] | null };

export function BookTools({ data }: { data: BookPathData }) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.from("models").select("id, name, short_description, time_estimate, tags").eq("status", "active").overlaps("tags", Array.from({ length: 15 }, (_, i) => `book-ch${i + 1}`)).order("name").then(({ data, error }) => {
      if (active) { setTools(data ?? []); setError(Boolean(error)); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  return <section className="max-w-5xl mx-auto px-6 lg:px-10 py-12 space-y-8 book-enter">
    <div className="space-y-4"><p className="book-eyebrow">Tools from the book</p><h1 className="book-display text-4xl lg:text-5xl">Tools from the book</h1><p>Practical frameworks that build on the chapters.</p></div>
    {loading ? <div role="status" aria-label="Loading tools" className="h-40 bg-muted rounded-xl animate-pulse" /> : error ? <p role="alert">We could not load the tools. Please try again.</p> : data.chapters.map(ch => {
      const matches = tools.filter(tool => tool.tags?.includes(`book-ch${ch.order_index}`));
      return matches.length ? <section key={ch.id} className="space-y-4"><h2 className="book-display text-2xl">Chapter {ch.order_index}: {chapterTitle(ch.name)}</h2>{matches.map(tool => <article key={tool.id} className="book-card bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 min-w-0"><h3 className="text-lg font-semibold">{tool.name}</h3>{tool.short_description && <p className="text-sm leading-relaxed">{tool.short_description}</p>}{tool.time_estimate && <p className="text-xs flex items-center gap-2"><Clock className="h-4 w-4" strokeWidth={1.5} />{tool.time_estimate}</p>}</div>
        <Button asChild variant="outline" className="rounded-full min-h-11 px-6 self-start sm:self-center"><Link to={`/book/tools/${tool.id}`}>Open<span className="sr-only"> {tool.name}</span></Link></Button>
      </article>)}</section> : null;
    })}
  </section>;
}

export function BookNotes({ data }: { data: BookPathData }) {
  const groups = savedBookNotes(data.chapters, data.responses);
  const download = () => {
    const url = URL.createObjectURL(new Blob([bookNotesText(data.chapters, data.responses)], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "beyond-the-book-my-notes.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="max-w-5xl mx-auto px-6 lg:px-10 py-12 space-y-8 book-enter">
    <div className="space-y-4"><p className="book-eyebrow">From your exercises</p><h1 className="book-display text-4xl lg:text-5xl">My notes</h1><Button variant="outline" className="rounded-full min-h-11" onClick={download} disabled={!groups.length}><Download className="h-4 w-4" />Download my notes</Button></div>
    {!groups.length ? <p>Your notes will appear here as you work through the exercises.</p> : groups.map(({ chapter, notes }) => <section key={chapter.id} className="space-y-4"><h2 className="book-display text-2xl">Chapter {chapter.order_index}: {chapterTitle(chapter.name)}</h2>{notes.map(({ step, text }) => <article key={step.id} className="book-card bg-card space-y-4"><p className="book-eyebrow">Video {step.section || step.id.slice(-1)}</p><h3 className="book-display text-2xl"><Link className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2" to={`/book/v/${step.id}`}>{step.title}</Link></h3><p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p></article>)}</section>)}
  </section>;
}