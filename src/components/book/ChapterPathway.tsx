import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookPoster } from "./BookPoster";
import { ChapterModels } from "./ChapterModels";
import { chapterTitle, type PathChapter, type deriveBookPath } from "@/lib/book-path";
import { bookVideoNumber } from "@/lib/book-video";
import { useLayoutEffect, useRef, useState } from "react";

type Path = ReturnType<typeof deriveBookPath>;
export function ChapterPanel({ chapter, path, onNext }: { chapter: PathChapter; path: Path; onNext?: (id: string) => void }) {
  const following = path.chapters.find(ch => ch.order_index === chapter.order_index + 1);
  return <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-8 book-enter" id="chapter-content">
    {!onNext && <Button asChild variant="ghost" className="px-0"><Link to="/book"><ArrowLeft className="h-4 w-4" />Back to your path</Link></Button>}
    <div className="flex flex-wrap justify-between items-start gap-6"><div className="space-y-4 max-w-3xl"><p className="book-eyebrow">Chapter {chapter.order_index} · {chapter.steps.filter(step => path.done[step.id]).length} of 3 complete</p><h2 className="book-display text-3xl lg:text-4xl">{chapterTitle(chapter.name)}</h2>{chapter.steps[0]?.reading && <p className="text-sm flex gap-3 items-center"><BookOpen className="h-4 w-4" />{chapter.steps[0].reading}</p>}</div>{following && (onNext ? <Button variant="outline" onClick={() => onNext(following.id)}>Next chapter<ArrowRight className="h-4 w-4" /></Button> : <Button asChild variant="outline"><Link to={`/book/chapter/${following.order_index}`}>Next chapter<ArrowRight className="h-4 w-4" /></Link></Button>)}</div>
    <div className="grid md:grid-cols-3 gap-6">{chapter.steps.map((step, index) => <article key={step.id} className="book-chapter-video min-w-0"><Link to={`/book/v/${step.id}`} aria-label={`Watch video ${bookVideoNumber(chapter.order_index, index)}: ${step.title}`} className="block relative"><BookPoster path={step.poster_path} label={bookVideoNumber(chapter.order_index, index)} />{path.done[step.id] && <span className="absolute top-4 right-4 bg-background text-foreground rounded-full p-2"><Check className="h-4 w-4" /></span>}</Link><div className="py-6 space-y-4"><p className="book-eyebrow">Video {bookVideoNumber(chapter.order_index, index)}</p><h3 className="text-lg font-semibold leading-snug">{step.title}</h3><Button variant="outline" asChild><Link to={`/book/v/${step.id}`}><Play className="h-4 w-4" />Watch and practise</Link></Button></div></article>)}</div>
    <ChapterModels chapter={chapter.order_index} />
  </section>;
}

export function ChapterPathway({ path, selected, onSelect }: { path: Path; selected: PathChapter; onSelect: (id: string) => void }) {
  const trail = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const element = trail.current;
    if (!element) return;
    const position = () => {
      const node = element.querySelector(`[data-chapter="${selected.order_index}"] .book-path-platform`);
      if (!(node instanceof HTMLElement) || !node.parentElement) return;
      setMarker({ x: node.offsetLeft + node.parentElement.offsetLeft + node.offsetWidth / 2, y: node.parentElement.offsetTop + 4 });
    };
    position();
    const observer = new ResizeObserver(position); observer.observe(element);
    return () => observer.disconnect();
  }, [selected.order_index]);
  return <section className="book-path-surface"><div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16">
    <div className="flex flex-wrap justify-between items-start gap-8 mb-12"><div className="space-y-4"><p className="book-eyebrow">Beyond the Book · Your path</p><h1 className="book-display text-4xl lg:text-6xl">From reading<br />to doing.</h1></div><div className="space-y-4 w-full sm:w-72"><p className="book-eyebrow">Your progress</p><p className="text-sm"><span className="text-3xl font-semibold">{path.doneCount}</span> / {path.total} exercises complete</p><progress value={path.doneCount} max={path.total || 1} className="book-progress w-full" aria-label="Exercise progress" />{path.nextStep && <Button asChild><Link to={`/book/v/${path.nextStep.id}`}>Continue your path<ArrowRight className="h-4 w-4" /></Link></Button>}</div></div>
    <div className="book-path-legend"><span><i className="book-legend-current" />Current chapter</span><span><i className="book-legend-started" />In progress</span><span><Check className="h-3 w-3" />Complete</span></div>
    <div ref={trail} className="book-pathway" aria-label="Chapter pathway">{marker && <span className="book-view-marker" aria-hidden="true" style={{ left: marker.x, top: marker.y }} />}{path.chapters.map((chapter) => {
      const complete = path.states[chapter.id] === "completed";
      const count = chapter.steps.filter(step => path.done[step.id]).length;
      const current = path.current?.id === chapter.id;
      const started = path.states[chapter.id] === "in progress";
      return <div key={chapter.id} data-chapter={chapter.order_index} className={`book-path-stop ${current ? "is-current" : ""} ${complete ? "is-complete" : ""}`}><div className="book-path-platform"><Button variant="ghost" onClick={() => onSelect(chapter.id)} aria-label={`Open chapter ${chapter.order_index}: ${chapterTitle(chapter.name)}`} aria-haspopup="dialog" aria-pressed={selected.id === chapter.id} className={`book-path-node ${current ? "is-current" : ""} ${complete ? "is-complete" : ""} ${started ? "is-started" : ""}`}><span className="book-display">{complete ? <Check className="h-7 w-7" /> : String(chapter.order_index).padStart(2, "0")}</span></Button></div><p className="book-path-label">{chapterTitle(chapter.name)}</p><span className="book-path-count">{complete ? "Complete" : started ? "In progress" : "Not started"}</span><span className="book-step-marks" aria-label={`${count} of 3 exercises complete`}>{chapter.steps.map(step => <i key={step.id} className={path.done[step.id] ? "is-done" : ""} />)}</span></div>;
    })}</div>
  </div></section>;
}