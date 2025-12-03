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
import { BookOpen, FlaskConical, Map, ArrowRight, CheckCircle2, Circle, ExternalLink, Heart, Sparkles } from "lucide-react";
import { NavigatorChat } from "@/components/NavigatorChat";
import { useRecommendations } from "@/hooks/use-recommendations";

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

interface Vendor {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
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
  const [followedVendors, setFollowedVendors] = useState<Vendor[]>([]);
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

        // Fetch followed vendors (liked by user)
        const { data: reactionsData } = await supabase
          .from("reactions")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "vendor");

        if (reactionsData && reactionsData.length > 0) {
          const vendorIds = reactionsData.map(r => r.target_id);
          const { data: vendorsData } = await supabase
            .from("vendors")
            .select("id, name, description, logo_url, website_url")
            .in("id", vendorIds)
            .limit(4);

          setFollowedVendors(vendorsData || []);
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

  const hasRecommendations = recommendations.models.length > 0 || recommendations.vendors.length > 0 || recommendations.resources.length > 0;

  return (
    <AppLayout>
      <HeroBanner
        emoji="🚀"
        title={`${getGreeting()}, ${firstName}!`}
        description="Welcome to Growth Lab — your command center for law firm growth strategies."
      />

      <div className="p-6 md:p-8 space-y-8">
        {/* AI Assistant */}
        <section>
          <NavigatorChat />
        </section>

        {/* Personalized Recommendations */}
        {!recommendations.loading && hasRecommendations && (
          <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Recommended For You</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommended Models */}
              {recommendations.models.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Models</h3>
                  <div className="space-y-2">
                    {recommendations.models.slice(0, 3).map((model) => (
                      <Link key={model.id} to={`/models/${model.id}`}>
                        <Card className="hover:shadow-md transition-all hover:border-primary/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            <span className="text-2xl">{model.emoji || "📚"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{model.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{model.short_description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Vendors */}
              {recommendations.vendors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Martech</h3>
                  <div className="space-y-2">
                    {recommendations.vendors.slice(0, 3).map((vendor) => (
                      <Link key={vendor.id} to="/martech">
                        <Card className="hover:shadow-md transition-all hover:border-primary/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            {vendor.logo_url ? (
                              <img src={vendor.logo_url} alt={vendor.name} className="h-8 w-8 rounded object-contain" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <span className="text-xs font-bold">{vendor.name.charAt(0)}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{vendor.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{vendor.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Insights */}
              {recommendations.resources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Insights Hub</h3>
                  <div className="space-y-2">
                    {recommendations.resources.slice(0, 3).map((resource) => (
                      <a key={resource.id} href={resource.url || '#'} target="_blank" rel="noopener noreferrer">
                        <Card className="hover:shadow-md transition-all hover:border-primary/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            <span className="text-2xl">{resource.emoji || "📄"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{resource.title}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">{resource.type}</Badge>
                                {resource.author && <span className="truncate">{resource.author}</span>}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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

        {/* My To-Dos */}
        <section>
          <h2 className="text-xl font-semibold mb-4">My To-Dos</h2>
          {loading ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : todos.length > 0 ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                {todos.map((todo) => (
                  <Link
                    key={todo.id}
                    to={`/models/${todo.modelId}/workspace`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {todo.stepTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {todo.modelEmoji} {todo.modelName} · Step {todo.stepNumber}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  No active tasks. Start a model to see your to-dos here!
                </p>
                <Link to="/models">
                  <Button variant="outline" size="sm">
                    Browse Models
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
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

        {/* Followed Vendors */}
        {followedVendors.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Followed Vendors</h2>
              <Link to="/martech">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {followedVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {vendor.logo_url ? (
                        <img
                          src={vendor.logo_url}
                          alt={vendor.name}
                          className="h-8 w-8 rounded object-contain"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold">{vendor.name.charAt(0)}</span>
                        </div>
                      )}
                      <h3 className="font-medium truncate">{vendor.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {vendor.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="h-3 w-3 mr-1 fill-current" /> Following
                      </Badge>
                      {vendor.website_url && (
                        <a
                          href={vendor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Visit
                        </a>
                      )}
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
