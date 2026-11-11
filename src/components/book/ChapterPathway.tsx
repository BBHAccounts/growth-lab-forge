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
  const [geometry, setGeometry] = useState<{ line: string; x: number; y: number }>({ line: "", x: 0, y: 0 });
  useLayoutEffect(() => {
    const element = trail.current;
    if (!element) return;
    const position = () => {
      const bounds = element.getBoundingClientRect();
      const points = Array.from(element.querySelectorAll<HTMLElement>(".book-path-node")).map(node => {
        const rect = node.getBoundingClientRect();
        return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
      });
      let line = "";
      points.forEach((point, i) => {
        const previous = points[i - 1];
        if (!previous) { line = `M ${point.x} ${point.y}`; return; }
        if (Math.abs(point.y - previous.y) > 40) {
          const side = point.x > bounds.width / 2 ? 1 : -1;
          const bend = side * Math.abs(point.y - previous.y) * 0.62;
          line += ` C ${previous.x + bend} ${previous.y}, ${point.x + bend} ${point.y}, ${point.x} ${point.y}`;
        } else {
          line += ` L ${point.x} ${point.y}`;
        }
      });
      const index = path.chapters.findIndex(ch => ch.id === selected.id);
      const point = points[index];
      setGeometry({ line, x: point?.x ?? 0, y: (point?.y ?? 0) - 52 });
    };
    position();
    const observer = new ResizeObserver(position); observer.observe(element);
    return () => observer.disconnect();
  }, [selected.id, path.chapters]);
  return <section className="book-path-surface">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 flex flex-wrap justify-between items-center gap-6">
      <div className="space-y-3"><p className="book-eyebrow">Beyond the Book</p><h1 className="book-display text-4xl lg:text-5xl">Your path</h1></div>
      <div className="flex flex-wrap items-center gap-6"><div className="space-y-3"><p className="text-sm"><strong>{path.doneCount} / {path.total}</strong> exercises complete</p><progress value={path.doneCount} max={path.total || 1} className="book-progress w-full" aria-label="Exercise progress" /></div>{path.nextStep && <Button asChild><Link to={`/book/v/${path.nextStep.id}`}>Continue your path<ArrowRight className="h-4 w-4" /></Link></Button>}</div>
    </div>
    <div className="book-constellation book-dot-grid"><div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      {path.total > 0 && path.doneCount === path.total && <div className="book-path-congrats mb-12 text-center space-y-3"><p className="book-eyebrow">Path complete</p><h2 className="book-display text-3xl lg:text-4xl">Congratulations, you have completed every chapter.</h2><p className="text-sm max-w-xl mx-auto">All {path.total} exercises are done. Your notes remain available whenever you want to revisit them.</p></div>}
      <div ref={trail} className="book-pathway" aria-label="Chapter pathway">
        <svg className="book-path-connections" aria-hidden="true"><defs><linearGradient id="book-path-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" className="book-path-stop-a" /><stop offset="50%" className="book-path-stop-b" /><stop offset="100%" className="book-path-stop-c" /></linearGradient></defs><path d={geometry.line} /></svg>
        {geometry.line && <span className="book-view-marker" aria-hidden="true" style={{ left: geometry.x, top: geometry.y }} />}
        {path.chapters.map(chapter => {
          const complete = path.states[chapter.id] === "completed";
          const count = chapter.steps.filter(step => path.done[step.id]).length;
          const current = path.current?.id === chapter.id;
          const started = path.states[chapter.id] === "in progress";
          return <div key={chapter.id} data-chapter={chapter.order_index} className={`book-path-stop ${current ? "is-current" : ""} ${complete ? "is-complete" : ""}`}>
            <p className="book-path-number">Chapter {chapter.order_index}</p>
            <div className="book-path-platform"><Button variant="ghost" onClick={() => onSelect(chapter.id)} aria-label={`Open chapter ${chapter.order_index}: ${chapterTitle(chapter.name)}`} aria-haspopup="dialog" aria-pressed={selected.id === chapter.id} className={`book-path-node ${current ? "is-current" : ""} ${complete ? "is-complete" : ""} ${started ? "is-started" : ""}`}><span className="book-display">{complete ? <span className="book-completed-tick" aria-hidden="true" /> : chapter.order_index}</span></Button></div>
            <p className="book-path-label">{chapterTitle(chapter.name)}</p>
            <span className="book-path-count">{complete ? "Complete" : started ? "In progress" : current ? "Start here" : "Not started"}</span>
            <span className="book-step-marks" aria-label={`${count} of 3 exercises complete`}>{chapter.steps.map(step => <i key={step.id} className={path.done[step.id] ? "is-done" : ""} />)}</span>
          </div>;
        })}
      </div>
    </div></div>
  </section>;
}
