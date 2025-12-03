import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Clock, Users, ArrowRight } from "lucide-react";
import { useReactions } from "@/hooks/use-reactions";

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

  const { isLiked, isLoading, toggleReaction } = useReactions({
    targetType: "model",
    targetIds: models.map(m => m.id),
  });

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

  const handleLike = async (e: React.MouseEvent, modelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasLiked = isLiked(modelId);
    
    // Optimistically update the UI
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, likes_count: (model.likes_count || 0) + (wasLiked ? -1 : 1) }
        : model
    ));
    
    await toggleReaction(modelId);
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
            {models.map((model) => (
              <Card
                key={model.id}
                className="group hover:shadow-elevated transition-all duration-300 flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-4xl">{model.emoji || "📚"}</span>
                    <button
                      onClick={(e) => handleLike(e, model.id)}
                      disabled={isLoading(model.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                        isLiked(model.id)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${isLiked(model.id) ? "fill-current" : ""}`} />
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
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
