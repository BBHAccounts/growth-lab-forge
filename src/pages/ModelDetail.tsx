import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, ThumbsUp, CheckCircle, ArrowLeft, Play } from "lucide-react";

interface ModelStep {
  id: string;
  title: string;
  instruction: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    optional?: boolean;
  }>;
}

interface Model {
  id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  emoji: string | null;
  audience: string[] | null;
  time_estimate: string | null;
  tags: string[] | null;
  outcomes: string[] | null;
  suggested_actions: string[] | null;
  likes_count: number | null;
  steps: ModelStep[];
}

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    const fetchModel = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast({
          title: "Error loading model",
          description: error.message,
          variant: "destructive",
        });
        navigate("/models");
        return;
      }

      // Parse steps from JSONB
      const parsedModel = {
        ...data,
        steps: Array.isArray(data.steps) ? (data.steps as unknown as ModelStep[]) : [],
      };
      setModel(parsedModel);
      setLoading(false);

      // Check if already activated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: activated } = await supabase
          .from("activated_models")
          .select("id")
          .eq("user_id", user.id)
          .eq("model_id", id)
          .single();
        
        setIsActivated(!!activated);
      }
    };

    fetchModel();
  }, [id, navigate, toast]);

  const handleActivate = async () => {
    if (!model) return;
    setActivating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to activate models.",
        variant: "destructive",
      });
      setActivating(false);
      return;
    }

    const { error } = await supabase
      .from("activated_models")
      .insert({
        user_id: user.id,
        model_id: model.id,
        progress: {},
        current_step: 0,
      });

    if (error) {
      if (error.code === "23505") {
        // Already activated
        navigate(`/models/${model.id}/workspace`);
      } else {
        toast({
          title: "Error activating model",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Model activated!",
        description: "You can now start working on this model.",
      });
      navigate(`/models/${model.id}/workspace`);
    }

    setActivating(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8">
          <div className="h-48 bg-muted rounded-lg mb-8" />
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </AppLayout>
    );
  }

  if (!model) return null;

  return (
    <AppLayout>
      <HeroBanner
        emoji={model.emoji || "📚"}
        title={model.name}
        description={model.short_description || ""}
      >
        <div className="flex flex-wrap gap-4 mt-6">
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/models")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
        </div>
      </HeroBanner>

      <div className="p-6 md:p-8 space-y-8">
        {/* Meta info */}
        <div className="flex flex-wrap gap-4 items-center">
          {model.time_estimate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {model.time_estimate}
            </Badge>
          )}
          {model.audience?.map((a) => (
            <Badge key={a} variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {a}
            </Badge>
          ))}
          <Badge variant="outline" className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {model.likes_count || 0} likes
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {model.long_description && (
              <Card>
                <CardHeader>
                  <CardTitle>About this Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {model.long_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {model.steps && model.steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Steps ({model.steps.length})</CardTitle>
                  <CardDescription>
                    Work through each step to complete the model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {model.steps.map((step, index) => (
                      <li key={step.id} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {step.instruction}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activate CTA */}
            <Card className="border-secondary/50 bg-secondary/5">
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={isActivated ? () => navigate(`/models/${model.id}/workspace`) : handleActivate}
                  disabled={activating}
                >
                  {isActivated ? (
                    <>
                      Continue Working
                      <Play className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Activate Model
                      <Play className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  {isActivated
                    ? "You've already activated this model"
                    : "Add to your dashboard and start working"}
                </p>
              </CardContent>
            </Card>

            {/* Outcomes */}
            {model.outcomes && model.outcomes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What You'll Create</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {model.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {model.tags && model.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
