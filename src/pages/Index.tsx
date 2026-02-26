import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, FlaskConical, MapPin, ArrowRight, CheckCircle2, Circle, ExternalLink, Heart, Sparkles, Info, Lightbulb } from "lucide-react";
import { NavigatorChat } from "@/components/NavigatorChat";
import { useRecommendations } from "@/hooks/use-recommendations";
import { ReadingReminderCard } from "@/components/ReadingReminderCard";

interface Profile {
  full_name: string | null;
  onboarding_completed: boolean | null;
}

interface ModelStep {
  title: string;
  description?: string;
}

interface Model {
  id: string;
  name: string;
  emoji: string | null;
  short_description: string | null;
  time_estimate: string | null;
  steps?: ModelStep[] | null;
}

interface ActivatedModel {
  id: string;
  model_id: string;
  current_step: number;
  completed: boolean;
  model: Model;
}




interface TodoItem {
  id: string;
  modelName: string;
  modelEmoji: string;
  stepTitle: string;
  stepNumber: number;
  modelId: string;
}

const Index = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activatedModels, setActivatedModels] = useState<ActivatedModel[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const recommendations = useRecommendations(5);

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

          // Generate todos from model steps
          const todoItems: TodoItem[] = [];
          activatedWithModels.forEach((am: any) => {
            if (!am.completed && am.model?.steps) {
              const steps = am.model.steps as ModelStep[];
              const currentStep = steps[am.current_step];
              if (currentStep) {
                todoItems.push({
                  id: `${am.id}-${am.current_step}`,
                  modelName: am.model.name,
                  modelEmoji: am.model.emoji || "📚",
                  stepTitle: currentStep.title,
                  stepNumber: am.current_step + 1,
                  modelId: am.model_id,
                });
              }
            }
          });
          setTodos(todoItems);
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
      title: "Toolbox",
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
      title: "Insights Hub",
      description: "Curated articles and resources",
      icon: Lightbulb,
      href: "/insights-hub",
      emoji: "💡",
    },
  ];

  const hasRecommendations = recommendations.models.length > 0 || recommendations.resources.length > 0;

  return (
    <AppLayout>
      <HeroBanner
        title={`${getGreeting()}, ${firstName}!`}
        description="Welcome to Growth Lab — your command center for law firm growth strategies."
      />

      <div className="p-6 md:p-8 space-y-8">
        {/* AI Assistant + To-Dos Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Assistant */}
          <section className="lg:col-span-2">
            <NavigatorChat />
          </section>

          {/* Your To-Dos */}
          <section className="lg:col-span-1">
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden h-full">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Your To-Dos</h3>
                    <p className="text-sm text-muted-foreground">Next steps to complete</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {/* Reading Reminder - shows if no article read in 2 weeks */}
                    <ReadingReminderCard />
                    
                    {/* Active model tasks */}
                    {todos.slice(0, 3).map((todo) => (
                      <li key={todo.id}>
                        <Link
                          to={`/models/${todo.modelId}/workspace`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{todo.stepTitle}</p>
                            <p className="text-xs text-muted-foreground">{todo.modelEmoji} {todo.modelName}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      </li>
                    ))}
                    
                    {/* Getting started items if no todos */}
                    {todos.length === 0 && (
                      <>
                        <li>
                          <Link
                            to="/account"
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            {profile?.onboarding_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-sm font-medium flex-1 ${profile?.onboarding_completed ? "line-through opacity-60" : "group-hover:text-primary transition-colors"}`}>Complete your profile</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/models"
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            {activatedModels.length > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-sm font-medium flex-1 ${activatedModels.length > 0 ? "line-through opacity-60" : "group-hover:text-primary transition-colors"}`}>Start your first model</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/martech"
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium flex-1 group-hover:text-primary transition-colors">Explore the Martech Map</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {todos.length > 3 && (
                      <li className="text-center">
                        <span className="text-xs text-muted-foreground">+{todos.length - 3} more tasks</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Personalized Recommendations */}
        {!recommendations.loading && hasRecommendations && (
          <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Recommended For You</h2>
                    <p className="text-sm text-muted-foreground">Curated based on your profile and interests</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">These recommendations are personalized based on your role, firm type, interests, and maturity levels. Update your profile to refine them.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recommended Models */}
                {recommendations.models.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📚</span>
                      <h3 className="font-medium">Growth Models</h3>
                    </div>
                    <div className="space-y-3">
                      {recommendations.models.slice(0, 3).map((model) => (
                        <Link key={model.id} to={`/models/${model.id}`}>
                          <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                                {model.emoji || "📚"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate group-hover:text-primary transition-colors">{model.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{model.short_description}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}


                {/* Recommended Insights */}
                {recommendations.resources.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <h3 className="font-medium">Insights Hub</h3>
                    </div>
                    <div className="space-y-3">
                      {recommendations.resources.slice(0, 3).map((resource) => (
                        <a key={resource.id} href={resource.url || '#'} target="_blank" rel="noopener noreferrer">
                          <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-xl shrink-0">
                                {resource.emoji || "📄"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate group-hover:text-primary transition-colors">{resource.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs capitalize">{resource.type}</Badge>
                                  {resource.author && <span className="truncate">by {resource.author}</span>}
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </CardContent>
                          </Card>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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



      </div>
    </AppLayout>
  );
};

export default Index;
