import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { useBookEntry } from "@/hooks/use-book-entry";
import { useBookPath } from "@/hooks/use-book-path";
import { deriveBookPath } from "@/lib/book-path";
import { ChapterPathway, ChapterPanel } from "@/components/book/ChapterPathway";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookNotes } from "@/components/book/BookLibraryViews";

export default function BookHome() {
  const state = useBookEntry();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useBookPath(state.user?.id);
  const { chapterNumber } = useParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const path = useMemo(() => data ? deriveBookPath(data.chapters, data.responses, data.sequential) : null, [data]);
  useEffect(() => {
    if (!state.loading && !state.error && !state.member) navigate("/book/join", { replace: true });
  }, [state, navigate]);
  const selected = path?.chapters.find(ch => chapterNumber ? ch.order_index === Number(chapterNumber) : ch.id === selectedId) ?? path?.current ?? path?.chapters[0];
  const section = location.pathname.split("/")[2];
  return <BookLayout path name={data?.name}>
    {state.loading || (state.member && loading) ? <div role="status" aria-label="Loading your path" className="max-w-7xl mx-auto p-6 lg:p-10 space-y-6"><div className="h-48 bg-muted rounded-xl animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div> : state.error || error ? <div className="p-10" role="alert"><p>{state.error || error}</p><Button className="rounded-full mt-6" onClick={() => window.location.reload()}>Try again</Button></div> : path && data && state.member ? <>
      {data.preview && <p role="status" className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 text-sm">BBHTEST preview</p>}
      {section === "notes" ? <BookNotes data={data} /> : selected ? chapterNumber ? <ChapterPanel chapter={selected} path={path} /> : <ChapterPathway path={path} selected={selected} onSelect={id => { setSelectedId(id); const chapter = path.chapters.find(ch => ch.id === id); if (chapter) navigate(`/book/chapter/${chapter.order_index}`); }} /> : null}
    </> : null}
  </BookLayout>;
}