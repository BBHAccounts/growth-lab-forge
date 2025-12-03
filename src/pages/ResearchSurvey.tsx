import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  required?: boolean;
}

interface Study {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  questions: Question[];
}

export default function ResearchSurvey() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to participate in research");
        navigate("/auth");
        return;
      }
      setUser(user);

      // Fetch study
      const { data, error } = await supabase
        .from("research_studies")
        .select("*")
        .eq("id", studyId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Study not found");
        navigate("/research");
        return;
      }

      // Check if already completed
      const { data: existingResponse } = await supabase
        .from("research_responses")
        .select("id")
        .eq("study_id", studyId)
        .eq("user_id", user.id)
        .eq("completed", true)
        .maybeSingle();

      if (existingResponse) {
        toast.info("You've already completed this survey");
        navigate("/research");
        return;
      }

      const parsedStudy: Study = {
        ...data,
        questions: Array.isArray(data.questions) 
          ? (data.questions as unknown as Question[]) 
          : [],
      };
      setStudy(parsedStudy);
      setLoading(false);
    };

    fetchData();
  }, [studyId, navigate]);

  const currentQ = study?.questions[currentQuestion];
  const progress = study ? ((currentQuestion + 1) / study.questions.length) * 100 : 0;
  const isLastQuestion = study ? currentQuestion === study.questions.length - 1 : false;

  const handleResponseChange = (value: string | string[]) => {
    if (currentQ) {
      setResponses({ ...responses, [currentQ.id]: value });
    }
  };

  const handleNext = () => {
    if (currentQ?.required && !responses[currentQ.id]) {
      toast.error("Please answer this question");
      return;
    }
    if (!isLastQuestion) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!study || !user) return;

    if (currentQ?.required && !responses[currentQ.id]) {
      toast.error("Please answer this question");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("research_responses").insert({
        study_id: study.id,
        user_id: user.id,
        responses: responses,
        completed: true,
      });

      if (error) throw error;

      // Update user's research_contributor status
      await supabase
        .from("profiles")
        .update({ research_contributor: true })
        .eq("user_id", user.id);

      toast.success("Thank you for completing the survey!");
      navigate("/research");
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Failed to submit survey");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const current = (responses[currentQ?.id || ""] as string[]) || [];
    if (checked) {
      handleResponseChange([...current, option]);
    } else {
      handleResponseChange(current.filter((o) => o !== option));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!study || !currentQ) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/research")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Research
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{study.emoji || "🧪"}</span>
            <h1 className="text-2xl font-bold">{study.title}</h1>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {study.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQ.question}
              {currentQ.required && <span className="text-destructive ml-1">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQ.type === "text" && (
              <Input
                placeholder="Your answer..."
                value={(responses[currentQ.id] as string) || ""}
                onChange={(e) => handleResponseChange(e.target.value)}
              />
            )}

            {currentQ.type === "textarea" && (
              <Textarea
                placeholder="Your answer..."
                value={(responses[currentQ.id] as string) || ""}
                onChange={(e) => handleResponseChange(e.target.value)}
                rows={4}
              />
            )}

            {currentQ.type === "single_choice" && currentQ.options && (
              <RadioGroup
                value={(responses[currentQ.id] as string) || ""}
                onValueChange={handleResponseChange}
              >
                {currentQ.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ.type === "multiple_choice" && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${i}`}
                      checked={((responses[currentQ.id] as string[]) || []).includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                    />
                    <Label htmlFor={`option-${i}`}>{option}</Label>
                  </div>
                ))}
              </div>
            )}

            {currentQ.type === "rating" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={responses[currentQ.id] === String(rating) ? "default" : "outline"}
                    className="w-12 h-12"
                    onClick={() => handleResponseChange(String(rating))}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
