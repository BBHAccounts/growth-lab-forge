import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseReactionsOptions {
  targetType: "vendor" | "model";
  targetIds: string[];
}

interface Reaction {
  target_id: string;
  reaction_type: string;
}

export function useReactions({ targetType, targetIds }: UseReactionsOptions) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserReactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || targetIds.length === 0) return;

      const { data } = await supabase
        .from("reactions")
        .select("target_id, reaction_type")
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .in("target_id", targetIds);

      if (data) {
        const reactionsMap: Record<string, boolean> = {};
        data.forEach((r: Reaction) => {
          reactionsMap[r.target_id] = true;
        });
        setUserReactions(reactionsMap);
      }
    };

    fetchUserReactions();
  }, [targetType, targetIds]);

  const toggleReaction = async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like items.",
        variant: "destructive",
      });
      return;
    }

    setLoading(prev => ({ ...prev, [targetId]: true }));
    const hasReaction = userReactions[targetId];

    try {
      if (hasReaction) {
        // Remove reaction
        await supabase
          .from("reactions")
          .delete()
          .eq("user_id", user.id)
          .eq("target_id", targetId)
          .eq("target_type", targetType);

        setUserReactions(prev => ({ ...prev, [targetId]: false }));
        toast({
          title: targetType === "vendor" ? "Unfollowed" : "Unliked",
          description: `You've ${targetType === "vendor" ? "unfollowed" : "unliked"} this ${targetType}.`,
        });
      } else {
        // Add reaction
        await supabase
          .from("reactions")
          .insert({
            user_id: user.id,
            target_id: targetId,
            target_type: targetType,
            reaction_type: "like",
          });

        setUserReactions(prev => ({ ...prev, [targetId]: true }));
        toast({
          title: targetType === "vendor" ? "Following!" : "Liked!",
          description: `You're now ${targetType === "vendor" ? "following" : "liking"} this ${targetType}.`,
        });
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [targetId]: false }));
    }
  };

  return {
    userReactions,
    loading,
    toggleReaction,
    isLiked: (targetId: string) => userReactions[targetId] || false,
    isLoading: (targetId: string) => loading[targetId] || false,
  };
}
