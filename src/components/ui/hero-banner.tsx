import { cn } from "@/lib/utils";
import { ReactNode } from "react";
interface HeroBannerProps {
  emoji?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: "yellow" | "subtle" | "dark";
}
export function HeroBanner({
  emoji,
  title,
  description,
  children,
  className,
  variant = "yellow"
}: HeroBannerProps) {
  const variants = {
    yellow: "hero-tech text-foreground",
    subtle: "hero-subtle text-foreground",
    dark: "bg-primary text-primary-foreground"
  };
  return <div className={cn("relative p-8 md:p-12", variants[variant], className)}>
      <div className="relative z-10 max-w-4xl">
        {emoji}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {description && <p className={cn("text-lg max-w-2xl", variant === "dark" ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {description}
          </p>}
        {children}
      </div>
    </div>;
}