import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookPathData } from "@/hooks/use-book-path";
import { chapterTitle } from "@/lib/book-path";
import { bookNotesText, savedBookNotes } from "@/lib/book-reader";

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