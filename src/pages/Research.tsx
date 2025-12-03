import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift, CheckCircle, Clock } from "lucide-react";

interface Study {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  reward_description: string | null;
  estimated_time: number | null;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
  }>;
}

export default function Research() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [completedStudies, setCompletedStudies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("research_studies")
        .select("*")
        .eq("active", true)
        .order("created_at");

      if (data) {
        const parsedStudies = data.map((s) => ({
          ...s,
          questions: Array.isArray(s.questions) ? (s.questions as unknown as Study['questions']) : [],
        }));
        setStudies(parsedStudies);
      }

      // Check completed studies
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: responses } = await supabase
          .from("research_responses")
          .select("study_id")
          .eq("user_id", user.id)
          .eq("completed", true);

        if (responses) {
          setCompletedStudies(responses.map((r) => r.study_id));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const isCompleted = (studyId: string) => completedStudies.includes(studyId);

  return (
    <AppLayout>
      <HeroBanner
        emoji="🧪"
        title="Research Lab"
        description="Participate in research studies to unlock premium content and contribute to industry benchmarks."
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* Reward Banner */}
        <Card className="border-chart-4/30 bg-chart-4/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-lg bg-chart-4/20 flex items-center justify-center">
              <Gift className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <h3 className="font-semibold">Unlock Premium Content</h3>
              <p className="text-sm text-muted-foreground">
                Complete research surveys to become a Research Contributor and access exclusive models and insights.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Studies Grid */}
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
        ) : studies.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold mb-2">No active studies</h3>
            <p className="text-muted-foreground">
              New research studies are coming soon. Check back later!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((study) => (
              <Card
                key={study.id}
                className={`group hover:shadow-elevated transition-all duration-300 cursor-pointer ${
                  isCompleted(study.id) ? "border-chart-4/50" : ""
                }`}
                onClick={() => setSelectedStudy(study)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-4xl">{study.emoji || "🧪"}</span>
                    {isCompleted(study.id) && (
                      <Badge className="bg-chart-4 text-chart-4-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {study.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {study.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span>{study.questions.length} questions</span>
                    {study.estimated_time && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{study.estimated_time} min
                        </span>
                      </>
                    )}
                    {study.reward_description && (
                      <>
                        <span>•</span>
                        <span className="text-chart-4 flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {study.reward_description}
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Study Detail Modal */}
      <Dialog open={!!selectedStudy} onOpenChange={() => setSelectedStudy(null)}>
        <DialogContent className="max-w-lg">
          {selectedStudy && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selectedStudy.emoji || "🧪"}</span>
                  <div>
                    <DialogTitle className="text-xl">{selectedStudy.title}</DialogTitle>
                    {isCompleted(selectedStudy.id) && (
                      <Badge className="bg-chart-4 text-chart-4-foreground mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <DialogDescription className="text-base">
                  {selectedStudy.description}
                </DialogDescription>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-chart-4" />
                    Reward
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedStudy.reward_description || "Become a Research Contributor"}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{selectedStudy.questions.length} questions</span>
                  {selectedStudy.estimated_time && (
                    <>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>~{selectedStudy.estimated_time} min</span>
                    </>
                  )}
                </div>

                {isCompleted(selectedStudy.id) ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Already Completed
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setSelectedStudy(null);
                      navigate(`/research/${selectedStudy.id}`);
                    }}
                  >
                    Start Survey
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
