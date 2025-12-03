import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  following: boolean;
  loading?: boolean;
  onClick: () => void;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({
  following,
  loading,
  onClick,
  size = "sm",
  className,
}: FollowButtonProps) {
  return (
    <Button
      variant={following ? "secondary" : "outline"}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={loading}
      className={cn("gap-1.5", className)}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
