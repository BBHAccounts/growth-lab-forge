import { Link } from "react-router-dom";
import { BookOpen, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookPoster } from "./BookPoster";
import { GradientWord } from "./GradientWord";
import { ChapterModels } from "./ChapterModels";
import { chapterCountWord, chapterOpeningText, chapterTitle, latestBookNote, type PathChapter, deriveBookPath } from "@/lib/book-path";
import type { BookResponses } from "@/lib/book";

export type DerivedPath = ReturnType<typeof deriveBookPath>;
export function ReadingLine({ chapter }: { chapter: PathChapter }) {
  const reading = chapter.steps[0]?.reading;
  return reading ? <p className="flex items-start gap-3 text-sm leading-relaxed"><BookOpen className="h-5 w-5 shrink-0" strokeWidth={1.5} /><span>Read: {reading.replace(/^Pages/i, "pages")} of the book</span></p> : null;
}
function Meter({ count, total }: { count: number; total: number }) {
  return <progress className="book-progress w-full" value={count} max={total || 1} aria-label={`${count} of ${total} done`} />;
}
export function MobileWeek({ path }: { path: DerivedPath }) {
  const chapter = path.current ?? path.chapters[path.chapters.length - 1];
  if (!chapter) return <p className="p-8">Your chapters are being prepared.</p>;
  const title = chapterTitle(chapter.name).split(" ");
  const finalWord = title.pop() ?? "";
  return <div className="lg:hidden">
    <section className="book-dot-grid bg-primary text-primary-foreground">
      <div className="px-6 py-10 book-enter">
        <p className="book-eyebrow mb-6">This week · Week {path.week} of 15</p>
        <h1 className="book-display text-4xl sm:text-5xl mb-6">Chapter {chapter.order_index}: {title.join(" ")} <GradientWord>{finalWord}</GradientWord></h1>
        <ReadingLine chapter={chapter} />
        {path.nextStep ? <Button asChild className="rounded-full mt-6 h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to={`/book/v/${path.nextStep.id}`}>Continue with video {path.nextStep.section}</Link></Button> : <p className="mt-6 font-semibold">All videos and exercises done</p>}
      </div>
    </section>
    <div className="px-6 py-8 space-y-8">
      <section><p className="book-eyebrow mb-4">This week&apos;s videos</p><div className="space-y-3">
        {chapter.steps.map(step => <Button key={step.id} variant="ghost" asChild className={`book-video-row h-auto w-full justify-start whitespace-normal bg-card hover:bg-card ${path.nextStep?.id === step.id ? "book-next-row" : ""}`}>
          <Link to={`/book/v/${step.id}`}><BookPoster path={step.poster_path} small /><span className="flex-1 min-w-0 text-left"><span className="book-eyebrow block mb-2">Video {step.section}</span><span className="font-semibold text-sm leading-snug block">{step.title}</span></span><span className={`book-status ${path.done[step.id] ? "bg-foreground text-background" : "border border-foreground/40"}`} aria-label={path.done[step.id] ? "Done" : "Not done"}>{path.done[step.id] && <Check className="h-4 w-4" />}</span></Link>
        </Button>)}
      </div></section>
      <ChapterModels chapter={chapter.order_index} />
      <section><p className="book-eyebrow mb-4">Your progress</p><p className="text-sm mb-3">{path.doneCount} of {path.total} videos</p><Meter count={path.doneCount} total={path.total} /></section>
    </div>
  </div>;
}
export function ChapterList({ path }: { path: DerivedPath }) {
  return <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 book-enter">
    <p className="book-eyebrow mb-4">15 chapters · 45 videos</p><h1 className="book-display text-4xl lg:text-5xl mb-4">All chapters</h1>
    <p className="max-w-2xl text-sm leading-relaxed mb-8">Follow the book one chapter a week. A new chapter opens when you finish the one before it, or when its week begins.</p>
    <div className="grid gap-4 lg:grid-cols-2">{path.chapters.map(chapter => {
      const state = path.states[chapter.id];
      const next = chapter.steps.find(s => !path.done[s.id]) ?? chapter.steps[0];
      const content = <><span className="book-display text-3xl w-12 shrink-0">{String(chapter.order_index).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="font-semibold block mb-3">{chapterTitle(chapter.name)}</span>{state === "locked" ? <span className="text-xs leading-relaxed block">{chapterOpeningText(chapter)}</span> : <span className="flex gap-2">{chapter.steps.map(s => <span key={s.id} className={`book-dot ${path.done[s.id] ? "bg-foreground" : "border border-foreground/40"}`} aria-label={`Video ${s.section}: ${path.done[s.id] ? "done" : "not done"}`} />)}</span>}{state === "in progress" && <span className="book-gradient-pill inline-block mt-3">This week</span>}</span>{state === "locked" && <Lock className="h-5 w-5 shrink-0" strokeWidth={1.5} />}</>;
      return state === "locked" ? <div key={chapter.id} className="book-card bg-card flex items-start gap-4">{content}</div> : <Button key={chapter.id} asChild variant="ghost" className={`book-card bg-card hover:bg-card h-auto whitespace-normal justify-start items-start gap-4 ${state === "in progress" ? "book-current-card" : ""}`}><Link to={`/book/v/${next?.id}`}>{content}</Link></Button>;
    })}</div>
  </section>;
}
export function DesktopPath({ path, selected, onSelect, unlocked, responses }: { path: DerivedPath; selected: PathChapter; onSelect: (id: string) => void; unlocked: number[]; responses: BookResponses }) {
  const next = selected.steps.find(s => !path.done[s.id]);
  const count = selected.steps.filter(s => path.done[s.id]).length;
  const nextLocked = path.chapters.find(ch => path.states[ch.id] === "locked");
  const preceding = path.chapters.find(ch => ch.order_index === (nextLocked?.order_index ?? 0) - 1);
  const remaining = preceding?.steps.filter(s => !path.done[s.id]).length ?? 3;
  const note = latestBookNote(path.chapters, responses);
  const openCount = path.chapters.filter(ch => path.states[ch.id] !== "locked").length;
  return <div className="hidden lg:block">
    <section className="book-dot-grid bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-10 pt-12 pb-10">
        <div className="flex items-start justify-between gap-12"><div className="max-w-2xl"><p className="book-eyebrow mb-6">Your path · Week {path.week} of 15</p><h1 className="book-display text-5xl">{chapterCountWord(openCount).replace(/^./, c => c.toUpperCase())} {openCount === 1 ? "chapter open" : "chapters open"}, {chapterCountWord(path.chapters.length - openCount)} still to unlock</h1></div><div className="shrink-0 text-right pt-6"><p className="book-display text-6xl">{path.doneCount} <span className="text-4xl">/ {path.total}</span></p><p className="text-xs mt-3">videos and exercises done</p></div></div>
        <div className="book-node-path mt-12" aria-label="Chapter path">{path.chapters.map(ch => {
          const state = path.states[ch.id];
          return <div key={ch.id} className={`book-node-item ${ch.order_index < (path.current?.order_index ?? 15) ? "book-line-open" : ""}`}>
            <Button size="icon" variant="ghost" aria-label={`Chapter ${ch.order_index}, ${state}`} aria-pressed={selected.id === ch.id} aria-disabled={state === "locked"} title={state === "locked" ? chapterOpeningText(ch) : ch.name} onClick={() => { if (state !== "locked") onSelect(ch.id); }} className={`book-node book-node-${state.replace(" ", "-")} ${unlocked.includes(ch.order_index) ? "book-unlock" : ""}`}>
              {state === "completed" ? <Check className="h-5 w-5" /> : state === "locked" ? <Lock className="h-4 w-4" strokeWidth={1.5} /> : ch.order_index}
            </Button><span className="text-[11px] mt-3 block">Ch {ch.order_index}</span>
          </div>;
        })}</div>
      </div>
    </section>
    <div className="max-w-7xl mx-auto px-10 py-10 grid grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] gap-6 book-enter">
      <section className="book-card bg-card min-w-0"><div className="flex justify-between gap-4 items-start"><p className="book-eyebrow">Chapter {selected.order_index} · {path.states[selected.id]}</p><span className="rounded-full bg-secondary px-3 py-2 text-xs whitespace-nowrap">{count} of 3 done</span></div><h2 className="book-display text-4xl mt-4 mb-6">{chapterTitle(selected.name)}</h2><ReadingLine chapter={selected} />
        <div className="grid grid-cols-3 gap-4 mt-8">{selected.steps.map(step => <article key={step.id} className="min-w-0"><Link to={`/book/v/${step.id}`} className="block relative rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4" aria-label={`Video ${step.section}: ${step.title}`}><BookPoster path={step.poster_path} />{path.done[step.id] ? <span className="absolute left-2 top-3 rounded-full bg-foreground text-background text-xs px-3 py-2 flex gap-1 items-center"><Check className="h-3 w-3" />Done</span> : next?.id === step.id ? <span className="absolute left-2 top-3 rounded-full bg-background text-primary text-xs px-3 py-2">Up next</span> : null}</Link><p className="book-eyebrow mt-4 mb-2">Video {step.section}</p><h3 className="text-sm leading-snug font-semibold">{step.title}</h3>{next?.id === step.id && <Button asChild className="rounded-full mt-4 h-auto min-h-11 whitespace-normal px-4 py-3 text-xs w-full"><Link to={`/book/v/${step.id}`}>Watch and do the exercise</Link></Button>}</article>)}</div>
      </section>
      <aside className="space-y-6"><ChapterModels chapter={selected.order_index} />{nextLocked && <section className="book-card bg-card"><p className="book-eyebrow mb-6">Next to unlock</p><Lock className="h-6 w-6 mb-4" strokeWidth={1.5} /><h2 className="book-display text-2xl mb-4">Chapter {nextLocked.order_index}: {chapterTitle(nextLocked.name)}</h2><p className="text-sm leading-relaxed mb-6">{chapterOpeningText(nextLocked)}, whichever comes first.</p><Meter count={3 - remaining} total={3} /><p className="text-xs mt-3">{remaining} {remaining === 1 ? "video" : "videos"} to go</p></section>}
        {note && <section className="book-card bg-card"><p className="book-eyebrow mb-6">From your notes</p><p className="text-sm leading-relaxed line-clamp-5 whitespace-pre-wrap">{note.text}</p><p className="text-xs font-semibold mt-4">Chapter {note.chapter.order_index} · Video {note.step.section}</p><Button asChild variant="link" className="px-0 h-11 mt-2"><Link to="/book/notes">See all notes</Link></Button></section>}
      </aside>
    </div>
  </div>;
}