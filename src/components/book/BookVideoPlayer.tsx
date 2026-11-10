import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getBookMediaSignedUrl } from "@/lib/book-api";
import type { BookStep } from "@/lib/book";

export function BookVideoPlayer({ step }: { step: BookStep }) {
  const [video, setVideo] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>();
  useEffect(() => {
    let active = true; setVideo(null); setPoster(undefined);
    if (step.video_path) getBookMediaSignedUrl(step.video_path).then(url => { if (active) setVideo(url); }).catch(() => {});
    if (step.poster_path) getBookMediaSignedUrl(step.poster_path).then(url => { if (active) setPoster(url); }).catch(() => {});
    return () => { active = false; };
  }, [step]);
  return <div className="book-video-player bg-primary text-primary-foreground mx-auto">
    {video ? <video src={video} poster={poster} controls playsInline preload="metadata" className="w-full h-full object-contain" aria-label={step.title} onError={() => setVideo(null)} /> : <div className="h-full flex flex-col items-center justify-center gap-5 px-6 text-center"><Play className="h-8 w-8 opacity-70" strokeWidth={1.5} /><p className="text-sm">This video is being prepared.</p></div>}
  </div>;
}