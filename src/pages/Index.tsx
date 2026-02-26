import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BookOpen, FlaskConical, ArrowRight, CheckCircle2, Circle,
  ExternalLink, Sparkles, Info, Lightbulb, Clock, Newspaper,
  TrendingUp, Calendar, GraduationCap
} from "lucide-react";
import { NavigatorChat } from "@/components/NavigatorChat";
import { useRecommendations } from "@/hooks/use-recommendations";
import { ReadingReminderCard } from "@/components/ReadingReminderCard";
import { format, differenceInDays, isPast } from "date-fns";

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

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  emoji: string | null;
  author: string | null;
  estimated_time: number | null;
  published_date: string | null;
  image_url: string | null;
}

interface EnrolledProgram {
  participant_id: string;
  access_code: string;
  status: string;
  program_name: string;
  program_description: string | null;
  deadline: string | null;
  model_emoji: string | null;
  model_name: string | null;
}

const Index = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activatedModels, setActivatedModels] = useState<ActivatedModel[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [enrolledPrograms, setEnrolledPrograms] = useState<EnrolledProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  const recommendations = useRecommendations(5);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, onboarding_completed")
          .eq("user_id", user.id)
          .single();

        setProfile(profileData);

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

        // Fetch enrolled programs
        const { data: participantData } = await supabase
          .from("program_participants")
          .select("id, access_code, status, program_id")
          .eq("user_id", user.id);

        if (participantData && participantData.length > 0) {
          const progIds = participantData.map(p => p.program_id);
          const { data: progsData } = await supabase
            .from("programs")
            .select("id, name, description, deadline, model_id, status")
            .in("id", progIds)
            .eq("status", "active");

          if (progsData && progsData.length > 0) {
            const mIds = progsData.filter(p => p.model_id).map(p => p.model_id!);
            let modelsLookup: Record<string, { name: string; emoji: string | null }> = {};
            if (mIds.length > 0) {
              const { data: mData } = await supabase
                .from("models")
                .select("id, name, emoji")
                .in("id", mIds);
              mData?.forEach(m => { modelsLookup[m.id] = { name: m.name, emoji: m.emoji }; });
            }

            const enrolled: EnrolledProgram[] = participantData
              .map(p => {
                const prog = progsData.find(pr => pr.id === p.program_id);
                if (!prog) return null;
                const model = prog.model_id ? modelsLookup[prog.model_id] : null;
                return {
                  participant_id: p.id,
                  access_code: p.access_code,
                  status: p.status,
                  program_name: prog.name,
                  program_description: prog.description,
                  deadline: prog.deadline,
                  model_emoji: model?.emoji || null,
                  model_name: model?.name || null,
                };
              })
              .filter(Boolean) as EnrolledProgram[];
            setEnrolledPrograms(enrolled);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        const { data } = await supabase
          .from("resources")
          .select("id, title, description, type, url, emoji, author, estimated_time, published_date, image_url")
          .eq("status", "active")
          .order("published_date", { ascending: false, nullsFirst: false })
          .limit(6);

        setNews((data || []) as NewsItem[]);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchDashboardData();
    fetchNews();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const hasRecommendations = recommendations.models.length > 0 || recommendations.resources.length > 0;

  const completedCount = activatedModels.filter(am => am.completed).length;
  const inProgressCount = activatedModels.filter(am => !am.completed).length;

  return (
    <AppLayout>
      {/* Compact Welcome Header */}
      <div className="border-b border-border bg-card">
        <div className="px-6 md:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {getGreeting()}, {firstName} 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening in your Growth Lab today.
              </p>
            </div>
            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{todos.length}</p>
                <p className="text-xs text-muted-foreground">To-Dos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Navigator - full width */}
        <section>
          <NavigatorChat />
        </section>

        {/* Row: To-Dos + Programmes + Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* To-Dos */}
          <section>
            <Card className="h-full border-border/60">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Your To-Dos</CardTitle>
                    <CardDescription className="text-xs">Next steps to complete</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    <ReadingReminderCard />
                    {todos.slice(0, 3).map((todo) => (
                      <li key={todo.id}>
                        <Link
                          to={`/models/${todo.modelId}/workspace`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group"
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
                    {enrolledPrograms
                      .filter(p => p.status !== 'submitted')
                      .slice(0, Math.max(0, 3 - todos.length))
                      .map((prog) => (
                        <li key={`prog-${prog.participant_id}`}>
                          <Link
                            to={`/program/${prog.access_code}${prog.status !== "invited" ? "/workspace" : ""}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group"
                          >
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {prog.status === 'in_progress' ? 'Continue' : 'Start'}: {prog.program_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{prog.model_emoji || "📋"} Programme</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        </li>
                      ))}
                    {todos.length === 0 && enrolledPrograms.filter(p => p.status !== 'submitted').length === 0 && (
                      <>
                        <li>
                          <Link to="/account" className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group">
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
                          <Link to="/models" className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group">
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
                          <Link to="/insights-hub" className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group">
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium flex-1 group-hover:text-primary transition-colors">Browse the Insights Hub</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        </li>
                      </>
                    )}
                    {todos.length > 3 && (
                      <li className="text-center pt-1">
                        <span className="text-xs text-muted-foreground">+{todos.length - 3} more tasks</span>
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Programmes */}
          <section>
            {enrolledPrograms.length > 0 ? (
              <Card className="h-full border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">My Programmes</CardTitle>
                        <CardDescription className="text-xs">Active assignments</CardDescription>
                      </div>
                    </div>
                    <Link to="/programmes">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-2">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {enrolledPrograms.slice(0, 3).map((prog) => {
                    const deadlineDays = prog.deadline ? differenceInDays(new Date(prog.deadline), new Date()) : null;
                    const overdue = prog.deadline ? isPast(new Date(prog.deadline)) : false;

                    return (
                      <Link key={prog.participant_id} to={`/program/${prog.access_code}${prog.status !== "invited" ? "/workspace" : ""}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                            {prog.model_emoji || "📋"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {prog.program_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                prog.status === "submitted" ? "default" :
                                prog.status === "in_progress" ? "secondary" : "outline"
                              } className="text-xs">
                                {prog.status === "in_progress" ? "In Progress" : prog.status === "submitted" ? "Submitted" : "Not Started"}
                              </Badge>
                              {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                              {!overdue && deadlineDays !== null && deadlineDays <= 7 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{deadlineDays}d
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-border/60 bg-muted/30 border-dashed">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">
                    No active programmes yet.
                  </p>
                  <Link to="/programmes">
                    <Button size="sm" variant="outline">
                      View Programmes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Active Models */}
          <section>
            {activatedModels.length > 0 ? (
              <Card className="h-full border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">My Active Models</CardTitle>
                    <Link to="/models">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-2">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {activatedModels.slice(0, 4).map((am) => {
                    const totalSteps = (am.model?.steps as ModelStep[] | undefined)?.length || 5;
                    const progressPct = am.completed ? 100 : Math.min((am.current_step / totalSteps) * 100, 95);
                    return (
                      <Link key={am.id} to={`/models/${am.model_id}/workspace`}>
                        <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors group">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-lg">{am.model?.emoji || "📚"}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{am.model?.name || "Model"}</h3>
                              <p className="text-xs text-muted-foreground">
                                {am.completed ? "✅ Completed" : `Step ${am.current_step + 1} of ${totalSteps}`}
                              </p>
                            </div>
                          </div>
                          <Progress value={progressPct} className="h-1.5" />
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-border/60 bg-muted/30 border-dashed">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">
                    Start a growth model to track progress here.
                  </p>
                  <Link to="/models">
                    <Button size="sm">
                      Browse Models <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        {/* Active Models row (only when programmes exist and user also has models) */}
        {enrolledPrograms.length > 0 && activatedModels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">My Active Models</h2>
              <Link to="/models">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8">
                  View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {activatedModels.slice(0, 4).map((am) => {
                const totalSteps = (am.model?.steps as ModelStep[] | undefined)?.length || 5;
                const progressPct = am.completed ? 100 : Math.min((am.current_step / totalSteps) * 100, 95);
                return (
                  <Link key={am.id} to={`/models/${am.model_id}/workspace`}>
                    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/40">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-lg">{am.model?.emoji || "📚"}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{am.model?.name || "Model"}</h3>
                            <p className="text-xs text-muted-foreground">
                              {am.completed ? "✅ Done" : `Step ${am.current_step + 1}/${totalSteps}`}
                            </p>
                          </div>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest News & Insights */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Newspaper className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Latest News & Insights</h2>
                <p className="text-sm text-muted-foreground">Fresh content curated for you</p>
              </div>
            </div>
            <Link to="/insights-hub">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-16 mb-3" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.slice(0, 6).map((item, index) => (
                <a
                  key={item.id}
                  href={item.url || `/insights-hub`}
                  target={item.url ? "_blank" : undefined}
                  rel={item.url ? "noopener noreferrer" : undefined}
                >
                  <Card className={`group h-full hover:shadow-lg transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                    {item.image_url && (
                      <div className="h-36 overflow-hidden rounded-t-lg">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className={`${item.image_url ? "p-4" : "p-5"}`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Badge variant="secondary" className="text-xs capitalize font-normal">
                          {item.type}
                        </Badge>
                        {item.estimated_time && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.estimated_time} min
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                        {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.author || "Growth Lab"}</span>
                        {item.published_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(item.published_date), "MMM d")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">New insights and articles will appear here.</p>
                <Link to="/insights-hub" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Browse Insights Hub</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Personalized Recommendations */}
        {!recommendations.loading && hasRecommendations && (
          <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Recommended For You</h2>
                    <p className="text-sm text-muted-foreground">Based on your profile and interests</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">Personalized based on your role, firm type, interests, and maturity levels.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations.models.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Growth Models</h3>
                    </div>
                    {recommendations.models.slice(0, 3).map((model) => (
                      <Link key={model.id} to={`/models/${model.id}`}>
                        <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                              {model.emoji || "📚"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{model.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{model.short_description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
                {recommendations.resources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Insights</h3>
                    </div>
                    {recommendations.resources.slice(0, 3).map((resource) => (
                      <a key={resource.id} href={resource.url || '#'} target="_blank" rel="noopener noreferrer">
                        <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-xl shrink-0">
                              {resource.emoji || "📄"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{resource.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
