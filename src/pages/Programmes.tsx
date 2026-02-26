import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, GraduationCap, CheckCircle, Circle } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

interface ProgramModelInfo {
  name: string;
  emoji: string | null;
  stepCount: number;
  deadline: string | null;
  modelId: string;
}

interface EnrolledProgram {
  participant_id: string;
  access_code: string;
  status: string;
  program: {
    id: string;
    name: string;
    description: string | null;
    deadline: string | null;
  };
  models: ProgramModelInfo[];
  completedModels: number;
  totalModels: number;
  formData: Record<string, unknown>;
  steps: Array<{ fields: Array<{ id: string }>; _modelId?: string }>;
}

export default function Programmes() {
  const [programs, setPrograms] = useState<EnrolledProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledPrograms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: participants } = await supabase
          .from("program_participants")
          .select("id, access_code, status, program_id")
          .eq("user_id", user.id);

        if (!participants || participants.length === 0) {
          setLoading(false);
          return;
        }

        const programIds = participants.map(p => p.program_id);

        const { data: programsData } = await supabase
          .from("programs")
          .select("id, name, description, deadline, status")
          .in("id", programIds)
          .eq("status", "active");

        if (!programsData) {
          setLoading(false);
          return;
        }

        // Fetch program_models with deadlines
        const { data: pmData } = await supabase
          .from("program_models")
          .select("program_id, model_id, order_index, deadline")
          .in("program_id", programsData.map(p => p.id))
          .order("order_index");

        const pmModelIds = pmData?.map(pm => pm.model_id) || [];
        const allModelIds = [...new Set(pmModelIds)];

        let modelsMap: Record<string, { name: string; emoji: string | null; steps: unknown[] }> = {};

        if (allModelIds.length > 0) {
          const { data: modelsData } = await supabase
            .from("models")
            .select("id, name, emoji, steps")
            .in("id", allModelIds);

          if (modelsData) {
            modelsData.forEach(m => {
              modelsMap[m.id] = {
                name: m.name,
                emoji: m.emoji,
                steps: Array.isArray(m.steps) ? m.steps : [],
              };
            });
          }
        }

        // Build program -> models mapping
        const programModelsMap: Record<string, ProgramModelInfo[]> = {};
        const programStepsMap: Record<string, Array<{ fields: Array<{ id: string }>; _modelId?: string }>> = {};
        if (pmData) {
          for (const pm of pmData) {
            if (!programModelsMap[pm.program_id]) {
              programModelsMap[pm.program_id] = [];
              programStepsMap[pm.program_id] = [];
            }
            const model = modelsMap[pm.model_id];
            if (model) {
              programModelsMap[pm.program_id].push({
                name: model.name,
                emoji: model.emoji,
                stepCount: model.steps.length,
                deadline: pm.deadline,
                modelId: pm.model_id,
              });
              // Build steps with model reference
              for (const step of model.steps as any[]) {
                programStepsMap[pm.program_id].push({
                  fields: step.fields || [],
                  _modelId: pm.model_id,
                });
              }
            }
          }
        }

        // Fetch responses
        const participantIds = participants.map(p => p.id);
        const { data: responses } = await supabase
          .from("program_responses")
          .select("participant_id, current_step, responses")
          .in("participant_id", participantIds);

        const responsesMap: Record<string, { currentStep: number; responses: Record<string, unknown> }> = {};
        responses?.forEach(r => {
          responsesMap[r.participant_id] = {
            currentStep: r.current_step || 0,
            responses: (r.responses as Record<string, unknown>) || {},
          };
        });

        // Helper: check if a model is completed based on form data
        const isModelCompleted = (
          modelId: string,
          steps: Array<{ fields: Array<{ id: string }>; _modelId?: string }>,
          formData: Record<string, unknown>
        ) => {
          const modelSteps = steps.filter(s => s._modelId === modelId);
          if (modelSteps.length === 0) return false;
          return modelSteps.every(step =>
            step.fields.some(field => {
              const value = formData[field.id];
              if (!value) return false;
              if (Array.isArray(value)) return value.length > 0 && value.some(v => v && String(v).trim());
              return String(value).trim().length > 0;
            })
          );
        };

        const enrolled: EnrolledProgram[] = [];
        participants.forEach(participant => {
          const program = programsData.find(p => p.id === participant.program_id);
          if (!program) return;

          const models = programModelsMap[program.id] || [];
          const steps = programStepsMap[program.id] || [];
          const responseInfo = responsesMap[participant.id] || { currentStep: 0, responses: {} };

          const completedModels = models.filter(m =>
            isModelCompleted(m.modelId, steps, responseInfo.responses)
          ).length;

          enrolled.push({
            participant_id: participant.id,
            access_code: participant.access_code,
            status: participant.status,
            program: {
              id: program.id,
              name: program.name,
              description: program.description,
              deadline: program.deadline,
            },
            models,
            completedModels,
            totalModels: models.length,
            formData: responseInfo.responses,
            steps,
          });
        });

        setPrograms(enrolled);
      } catch (error) {
        console.error("Error fetching enrolled programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledPrograms();
  }, []);

  const getDeadlineBadge = (deadline: string | null) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const daysLeft = differenceInDays(deadlineDate, new Date());

    if (isPast(deadlineDate)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    }
    if (daysLeft <= 3) {
      return <Badge className="text-xs bg-destructive/15 text-destructive border-0">{daysLeft}d left</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge className="text-xs bg-accent text-accent-foreground border-0">{daysLeft}d left</Badge>;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-secondary text-secondary-foreground border-0">Submitted</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-primary" />
            My Programmes
          </h1>
          <p className="text-muted-foreground mt-1">
            Your enrolled programmes and assignments
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((item) => {
              const progressPct = item.status === "submitted" ? 100 :
                item.totalModels > 0 ? Math.round((item.completedModels / item.totalModels) * 100) : 0;

              return (
                <Card key={item.participant_id} className="group hover:shadow-lg transition-all duration-200 hover:border-primary/40">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                          {item.models.length > 0 ? item.models[0].emoji || "📋" : "📋"}
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {item.program.name}
                          </h3>
                          {item.models.length === 1 && (
                            <p className="text-sm text-muted-foreground">{item.models[0].name}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    {item.program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {item.program.description}
                      </p>
                    )}

                    {/* Models with deadlines */}
                    {item.models.length > 0 && (
                      <div className="space-y-1.5 mb-4">
                        {item.models.map((m, i) => {
                          const isCompleted = (() => {
                            const modelSteps = item.steps.filter(s => s._modelId === m.modelId);
                            if (modelSteps.length === 0) return false;
                            return modelSteps.every(step =>
                              step.fields.some(field => {
                                const value = item.formData[field.id];
                                if (!value) return false;
                                if (Array.isArray(value)) return value.length > 0 && value.some(v => v && String(v).trim());
                                return String(value).trim().length > 0;
                              })
                            );
                          })();

                          return (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-chart-4 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className={isCompleted ? "text-chart-4" : "text-foreground"}>
                                {m.emoji} {m.name}
                              </span>
                              {m.deadline && (
                                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(m.deadline), "MMM d")}
                                </span>
                              )}
                              {getDeadlineBadge(m.deadline)}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Progress */}
                    {item.totalModels > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>
                            {item.status === "submitted" ? "Completed" : `${item.completedModels} of ${item.totalModels} tasks completed`}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.program.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(item.program.deadline), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        {getDeadlineBadge(item.program.deadline)}
                      </div>
                      <Link to={`/program/${item.access_code}`}>
                        <Button size="sm" variant={item.status === "submitted" ? "outline" : "default"}>
                          {item.status === "submitted" ? "Review" : item.status === "in_progress" ? "Continue" : "Start"}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No programmes yet</h3>
              <p className="text-muted-foreground text-sm">
                When you're enrolled in a programme, it will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}