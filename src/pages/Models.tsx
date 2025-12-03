import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowRight, Heart } from "lucide-react";
import { useUserReactions } from "@/hooks/useReactions";
import { useToast } from "@/hooks/use-toast";

interface Model {
  id: string;
  name: string;
  short_description: string | null;
  emoji: string | null;
  audience: string[] | null;
  time_estimate: string | null;
  tags: string[] | null;
  likes_count: number | null;
  unlock_level: string | null;
}

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const userLikes = useUserReactions("model", "like");
  const { toast } = useToast();

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setModels(data);
      }
      setLoading(false);
    };

    fetchModels();
  }, []);

  const handleLike = async (modelId: string, currentlyLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    if (currentlyLiked) {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_id", modelId)
        .eq("target_type", "model")
        .eq("reaction_type", "like");
    } else {
      await supabase.from("reactions").insert({
        user_id: user.id,
        target_id: modelId,
        target_type: "model",
        reaction_type: "like",
      });
    }

    // Refresh
    window.location.reload();
  };

  return (
    <AppLayout>
      <HeroBanner
        emoji="📚"
        title="Models"
        description="Interactive strategic frameworks to help you plan, position, and grow your practice."
      />

      <div className="p-6 md:p-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : models.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No models yet</h3>
            <p className="text-muted-foreground">
              Models are being prepared. Check back soon!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => {
              const isLiked = userLikes[model.id] || false;
              return (
                <Card
                  key={model.id}
                  className="group hover:shadow-elevated transition-all duration-300 flex flex-col"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-4xl">{model.emoji || "📚"}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleLike(model.id, isLiked);
                        }}
                        className={`flex items-center gap-1 transition-colors ${
                          isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        <span className="text-sm">{model.likes_count || 0}</span>
                      </button>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {model.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {model.short_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {model.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {model.time_estimate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {model.time_estimate}
                        </span>
                      )}
                      {model.audience && model.audience.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {model.audience.join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto">
                      <Button asChild className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                        <Link to={`/models/${model.id}`}>
                          View Model
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
