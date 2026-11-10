import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { useBookEntry } from "@/hooks/use-book-entry";
import { useBookPath } from "@/hooks/use-book-path";
import { deriveBookPath } from "@/lib/book-path";
import { ChapterList, DesktopPath, MobileWeek } from "@/components/book/BookPathViews";
import { Button } from "@/components/ui/button";

export default function BookHome() {
  const state = useBookEntry();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useBookPath(state.user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const path = useMemo(() => data ? deriveBookPath(data.chapters, data.responses, data.sequential) : null, [data]);
  useEffect(() => {
    if (!state.loading && !state.error && !state.member) navigate("/book/join", { replace: true });
  }, [state, navigate]);
  useEffect(() => {
    if (!path || !data) return;
    const key = `book-completed:${data.userId}:${data.programmeId}`;
    try {
      const previous = JSON.parse(localStorage.getItem(key) ?? "null");
      if (Array.isArray(previous)) {
        const newlyOpen = path.completed.filter(n => !previous.includes(n)).map(n => n + 1).filter(n => n <= 15 && path.chapters.some(ch => ch.order_index === n && path.states[ch.id] !== "locked"));
        setUnlocked(newlyOpen);
        if (newlyOpen.length) setNotice(`Chapter ${newlyOpen[0]} is now open`);
      }
      localStorage.setItem(key, JSON.stringify(path.completed));
    } catch { /* A missing visit record must never affect access. */ }
    const timer = window.setTimeout(() => { setNotice(""); setUnlocked([]); }, 6000);
    return () => window.clearTimeout(timer);
  }, [path, data]);
  const selected = path?.chapters.find(ch => ch.id === selectedId && path.states[ch.id] !== "locked") ?? path?.current ?? path?.chapters[0];
  const section = location.pathname.split("/")[2];
  return <BookLayout path name={data?.name}>
    {state.loading || (state.member && loading) ? <div role="status" aria-label="Loading your path" className="max-w-7xl mx-auto p-6 lg:p-10 space-y-6"><div className="h-48 bg-muted rounded-xl animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div> : state.error || error ? <div className="p-10" role="alert"><p>{state.error || error}</p><Button className="rounded-full mt-6" onClick={() => window.location.reload()}>Try again</Button></div> : path && data && state.member ? <>
      {section === "chapters" ? <ChapterList path={path} /> : section === "tools" || section === "notes" ? <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12"><p className="book-eyebrow mb-4">Beyond the Book</p><h1 className="book-display text-4xl">{section === "tools" ? "Tools" : "My notes"}</h1></section> : <><MobileWeek path={path} />{selected && <DesktopPath path={path} selected={selected} onSelect={setSelectedId} unlocked={unlocked} responses={data.responses} />}</>}
      {notice && <div role="status" className="book-toast fixed bottom-24 lg:bottom-6 left-6 right-6 lg:left-auto lg:w-auto rounded-2xl bg-primary text-primary-foreground px-6 py-4 shadow-elevated">{notice}</div>}
    </> : null}
  </BookLayout>;
}