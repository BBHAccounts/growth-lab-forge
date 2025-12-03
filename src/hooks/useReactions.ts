import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ReactionType = "like" | "follow";
type TargetType = "model" | "vendor";

interface UseReactionsOptions {
  targetType: TargetType;
  targetId: string;
  reactionType?: ReactionType;
}

export function useReactions({ targetType, targetId, reactionType = "like" }: UseReactionsOptions) {
  const [hasReacted, setHasReacted] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkReaction = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_id", targetId)
        .eq("target_type", targetType)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      setHasReacted(!!data);
    };

    if (targetId) {
      checkReaction();
    }
  }, [targetId, targetType, reactionType]);

  const toggleReaction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (hasReacted) {
        await supabase
          .from("reactions")
          .delete()
          .eq("user_id", user.id)
          .eq("target_id", targetId)
          .eq("target_type", targetType)
          .eq("reaction_type", reactionType);

        setHasReacted(false);
        setCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from("reactions").insert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          reaction_type: reactionType,
        });

        setHasReacted(true);
        setCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { hasReacted, count, setCount, loading, toggleReaction };
}

// Hook to check multiple reactions at once
export function useUserReactions(targetType: TargetType, reactionType: ReactionType = "like") {
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchReactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reactions")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("reaction_type", reactionType);

      if (data) {
        const reactionMap: Record<string, boolean> = {};
        data.forEach((r) => {
          reactionMap[r.target_id] = true;
        });
        setReactions(reactionMap);
      }
    };

    fetchReactions();
  }, [targetType, reactionType]);

  return reactions;
}
