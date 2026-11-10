import { useEffect, useRef, useState } from "react";
import type { BookResponses } from "@/lib/book";
import { getBookDone } from "@/lib/book";
import { saveBookResponses, saveBookStepDone } from "@/lib/book-api";

export function useBookNotes(userId: string, participantId: string, initial: BookResponses, fieldId: string, stepId: string) {
  const key = `book-draft:${userId}:${participantId}:${fieldId}`;
  const [responses, setResponses] = useState<BookResponses>(() => {
    const draft = localStorage.getItem(key);
    return draft === null ? initial : { ...initial, [fieldId]: draft };
  });
  const [status, setStatus] = useState("Saved");
  const latest = useRef(responses);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);
  const persist = (snapshot: BookResponses) => {
    setStatus("Saving");
    const task = queue.current.catch(() => {}).then(async () => {
      await saveBookResponses(participantId, { ...snapshot, __done: latest.current.__done });
      if (latest.current[fieldId] === snapshot[fieldId]) {
        localStorage.removeItem(key);
        if (mounted.current) setStatus("Saved");
      }
    });
    queue.current = task;
    return task.catch(() => { if (mounted.current) setStatus("Not saved. Please try again."); throw new Error("Save failed"); });
  };
  const edit = (value: string) => {
    const next = { ...latest.current, [fieldId]: value };
    latest.current = next; setResponses(next); localStorage.setItem(key, value); setStatus("Saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void persist(latest.current).catch(() => {}); }, 1000);
  };
  const flush = async () => { clearTimeout(timer.current); await persist(latest.current); };
  const toggleDone = async () => {
    clearTimeout(timer.current);
    const task = queue.current.catch(() => {}).then(async () => {
      const snapshot = latest.current;
      const next = await saveBookStepDone(participantId, snapshot, stepId, !getBookDone(snapshot)[stepId]);
      latest.current = { ...latest.current, __done: next.__done };
      if (mounted.current) setResponses(latest.current);
      if (latest.current[fieldId] === snapshot[fieldId]) { localStorage.removeItem(key); if (mounted.current) setStatus("Saved"); }
    });
    queue.current = task;
    await task;
  };
  useEffect(() => {
    mounted.current = true;
    if (localStorage.getItem(key) !== null) timer.current = setTimeout(() => { void persist(latest.current).catch(() => {}); }, 1000);
    return () => {
      mounted.current = false; clearTimeout(timer.current);
      if (localStorage.getItem(key) !== null) {
        queue.current = queue.current.catch(() => {}).then(async () => {
          const snapshot = latest.current;
          await saveBookResponses(participantId, snapshot);
          if (localStorage.getItem(key) === snapshot[fieldId]) localStorage.removeItem(key);
        }).catch(() => {});
      }
    };
  }, [key]);
  return { responses, value: typeof responses[fieldId] === "string" ? responses[fieldId] as string : "", status, edit, flush, toggleDone };
}