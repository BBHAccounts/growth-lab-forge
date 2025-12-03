import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HeroBannerProps {
  emoji?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function HeroBanner({ emoji, title, description, children, className }: HeroBannerProps) {
  return (
    <div className={cn("gradient-hero text-primary-foreground p-8 md:p-12", className)}>
      <div className="max-w-4xl">
        {emoji && <span className="text-4xl md:text-5xl mb-4 block">{emoji}</span>}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-primary-foreground/80 text-lg max-w-2xl">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
