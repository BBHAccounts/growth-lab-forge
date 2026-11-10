import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModelLibrary } from "@/hooks/use-model-library";
import { linkedChapters } from "@/lib/model-library";

export default function ModelLibrary() {
  const { entry, data = [], isLoading, error, refetch } = useModelLibrary();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [chapter, setChapter] = useState<number | null>(null);
  useEffect(() => {
    if (!entry.loading && !entry.error && !entry.member) navigate(entry.user ? "/book/join" : "/auth?returnTo=%2Fbook%2Flibrary", { replace: true });
  }, [entry, navigate]);
  const chapters = [...new Set(data.flatMap(model => linkedChapters(model.tags)))].sort((a, b) => a - b);
  const models = data.filter(model => (!chapter || linkedChapters(model.tags).includes(chapter)) && `${model.name} ${model.short_description ?? ""}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <BookLayout><section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-8 book-enter">
    <div className="space-y-4"><p className="book-eyebrow">Beyond the Book</p><h1 className="book-display text-4xl lg:text-5xl">Model library</h1></div>
    <div className="space-y-4"><div className="relative max-w-lg"><Search className="absolute left-4 top-3 h-5 w-5 pointer-events-none" strokeWidth={1.5} /><Input aria-label="Search models" placeholder="Search models" value={search} onChange={e => setSearch(e.target.value)} className="pl-12" /></div>
      <div className="flex flex-wrap gap-2" aria-label="Filter by chapter"><Button variant={chapter === null ? "default" : "outline"} aria-pressed={chapter === null} onClick={() => setChapter(null)}>All</Button>{chapters.map(n => <Button key={n} variant={chapter === n ? "default" : "outline"} aria-pressed={chapter === n} onClick={() => setChapter(n)}>Chapter {n}</Button>)}</div>
    </div>
    {entry.error || error ? <div role="alert" className="space-y-4"><p>We could not load the model library. Please try again.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div> : entry.loading || isLoading ? <div role="status" aria-label="Loading models" className="h-48 bg-muted rounded-xl animate-pulse" /> : entry.member ? <>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{models.map(model => <article key={model.id} className="book-card bg-card flex flex-col gap-4 min-w-0"><h2 className="book-display text-2xl break-words"><Link to={`/book/library/${model.id}`}>{model.name}</Link></h2>{model.short_description && <p className="text-sm leading-relaxed">{model.short_description}</p>}{linkedChapters(model.tags).length > 0 && <p className="text-xs">{linkedChapters(model.tags).map(n => `Chapter ${n}`).join(" · ")}</p>}<Button asChild variant="outline" className="self-start mt-auto"><Link to={`/book/library/${model.id}`}>Open model<ArrowUpRight className="h-4 w-4" /><span className="sr-only"> {model.name}</span></Link></Button></article>)}</div>
      {!models.length && <p>No models found.</p>}
    </> : null}
  </section></BookLayout>;
}