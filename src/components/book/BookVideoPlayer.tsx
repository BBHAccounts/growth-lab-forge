import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getBookMediaSignedUrl } from "@/lib/book-api";
import type { BookStep } from "@/lib/book";
import { Button } from "@/components/ui/button";

export function BookVideoPlayer({ step, label }: { step: BookStep; label: string }) {
  const [playing, setPlaying] = useState(false);
  const [video, setVideo] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>();
  useEffect(() => {
    let active = true; setVideo(null); setPoster(undefined); setPlaying(false);
    if (step.video_path) getBookMediaSignedUrl(step.video_path).then(url => { if (active) setVideo(url); }).catch(() => {});
    if (step.poster_path) getBookMediaSignedUrl(step.poster_path).then(url => { if (active) setPoster(url); }).catch(() => {});
    return () => { active = false; };
  }, [step]);
  return <div className="book-video-player bg-primary text-primary-foreground mx-auto">
    {video && playing ? <video src={video} poster={poster} controls autoPlay playsInline preload="metadata" className="w-full h-full object-contain" aria-label={`Video ${label}: ${step.title}`} onError={() => { setVideo(null); setPlaying(false); }} /> : <div className="relative h-full flex flex-col items-center justify-center gap-5 px-6 text-center">{poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}<span className="relative book-eyebrow">Video</span><span className="relative book-display text-6xl">{label}</span>{video ? <Button variant="secondary" className="relative" onClick={() => setPlaying(true)} aria-label={`Play video ${label}`}><Play className="h-5 w-5" strokeWidth={1.5} />Play video</Button> : <><Play className="relative h-8 w-8 opacity-70" strokeWidth={1.5} /><p className="relative text-sm">This video is being prepared.</p></>}</div>}
  </div>;
}