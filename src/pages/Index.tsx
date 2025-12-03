import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FlaskConical, Map, ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface Profile {
  full_name: string | null;
  onboarding_completed: boolean | null;
}

interface Model {
  id: string;
  name: string;
  emoji: string | null;
  short_description: string | null;
  time_estimate: string | null;
}

interface ActivatedModel {
  id: string;
  model_id: string;
  current_step: number;
  completed: boolean;
  model: Model;
}

const Index = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activatedModels, setActivatedModels] = useState<ActivatedModel[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, onboarding_completed")
          .eq("user_id", user.id)
          .single();

        setProfile(profileData);

        // Fetch activated models with model details
        const { data: activatedData } = await supabase
          .from("activated_models")
          .select("id, model_id, current_step, completed")
          .eq("user_id", user.id);

        if (activatedData && activatedData.length > 0) {
          // Fetch model details for activated models
          const modelIds = activatedData.map(am => am.model_id);
          const { data: modelsData } = await supabase
            .from("models")
            .select("id, name, emoji, short_description, time_estimate, steps")
            .in("id", modelIds);

          const activatedWithModels = activatedData.map(am => ({
            ...am,
            model: modelsData?.find(m => m.id === am.model_id) || {} as Model
          }));
          setActivatedModels(activatedWithModels as ActivatedModel[]);

          // Get recommended models (ones not activated yet)
          const { data: recommendedData } = await supabase
            .from("models")
            .select("id, name, emoji, short_description, time_estimate")
            .not("id", "in", `(${modelIds.join(",")})`)
            .limit(3);

          setRecommendedModels(recommendedData || []);
        } else {
          // No activated models, show all as recommendations
          const { data: allModels } = await supabase
            .from("models")
            .select("id, name, emoji, short_description, time_estimate")
            .limit(3);

          setRecommendedModels(allModels || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const quickAccessCards = [
    {
      title: "Models",
      description: "Interactive frameworks to grow your practice",
      icon: BookOpen,
      href: "/models",
      emoji: "📚",
    },
    {
      title: "Research Lab",
      description: "Participate in studies, unlock rewards",
      icon: FlaskConical,
      href: "/research",
      emoji: "🧪",
    },
    {
      title: "Martech Map",
      description: "Explore legal marketing technology",
      icon: Map,
      href: "/martech",
      emoji: "🗺️",
    },
  ];

  const gettingStartedSteps = [
    { label: "Complete your profile", done: profile?.onboarding_completed || false, href: "/account" },
    { label: "Browse available models", done: true, href: "/models" },
    { label: "Start your first model", done: activatedModels.length > 0, href: "/models" },
    { label: "Explore the Martech Map", done: false, href: "/martech" },
  ];

  return (
    <AppLayout>
      <HeroBanner
        emoji="🚀"
        title={`${getGreeting()}, ${firstName}!`}
        description="Welcome to Growth Lab — your command center for law firm growth strategies."
      />

      <div className="p-6 md:p-8 space-y-8">
        {/* Quick Access Cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickAccessCards.map((card) => (
              <Link key={card.title} to={card.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{card.emoji}</span>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {card.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{card.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* My Activated Models */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Activated Models</h2>
            {activatedModels.length > 0 && (
              <Link to="/models">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activatedModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activatedModels.map((am) => (
                <Card key={am.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{am.model?.emoji || "📚"}</span>
                        <div>
                          <h3 className="font-medium">{am.model?.name || "Model"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {am.completed ? "Completed" : `Step ${am.current_step + 1}`}
                          </p>
                        </div>
                      </div>
                      <Link to={`/models/${am.model_id}/workspace`}>
                        <Button size="sm" variant={am.completed ? "outline" : "default"}>
                          {am.completed ? "Review" : "Continue"}
                        </Button>
                      </Link>
                    </div>
                    <Progress value={am.completed ? 100 : Math.min((am.current_step / 5) * 100, 90)} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't started any models yet. Browse our collection and start growing your practice!
                </p>
                <Link to="/models">
                  <Button>
                    Browse Models <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recommended For You */}
        {recommendedModels.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Recommended For You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedModels.map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{model.emoji || "📚"}</span>
                      <CardTitle className="text-base">{model.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3 line-clamp-2">
                      {model.short_description}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{model.time_estimate}</span>
                      <Link to={`/models/${model.id}`}>
                        <Button size="sm" variant="outline">
                          Start
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Getting Started Guide */}
        {activatedModels.length === 0 && !loading && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {gettingStartedSteps.map((step, index) => (
                    <li key={index}>
                      <Link
                        to={step.href}
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        {step.done ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={step.done ? "line-through text-muted-foreground" : ""}>
                          {step.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
