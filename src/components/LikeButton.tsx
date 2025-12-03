import { Heart, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  loading?: boolean;
  onClick: () => void;
  variant?: "heart" | "thumbs";
  size?: "sm" | "default";
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  liked,
  count,
  loading,
  onClick,
  variant = "heart",
  size = "default",
  showCount = true,
  className,
}: LikeButtonProps) {
  const Icon = variant === "heart" ? Heart : ThumbsUp;
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={loading}
      className={cn(
        "gap-1.5",
        liked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Icon className={cn(iconSize, liked && "fill-current")} />
      {showCount && <span className="text-sm">{count}</span>}
    </Button>
  );
}
