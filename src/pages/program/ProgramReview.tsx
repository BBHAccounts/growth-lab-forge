import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProgramLayout } from "@/components/program/ProgramLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, CheckCircle, Circle, Edit2, Send } from "lucide-react";

interface ModelField {
  id: string;
  type: string;
  label: string;
  columns?: Array<{ id: string; label: string }>;
}

interface ModelStep {
  id: string;
  title: string;
  fields: ModelField[];
  _modelName?: string;
}

interface Program {
  id: string;
  name: string;
  model_id: string | null;
}

export default function ProgramReview() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ModelStep[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [responseId, setResponseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!code) {
        navigate("/");
        return;
      }

      try {
        const { data: participantData } = await supabase
          .from("program_participants")
          .select("*")
          .eq("access_code", code)
          .single();

        if (!participantData) {
          navigate("/");
          return;
        }

        setParticipantId(participantData.id);

        const { data: programData } = await supabase
          .from("programs")
          .select("*")
          .eq("id", participantData.program_id)
          .single();

        if (!programData) {
          navigate("/");
          return;
        }

        setProgram(programData);

        // Load steps from program_models or fallback
        let allSteps: ModelStep[] = [];

        const { data: pmData } = await supabase
          .from("program_models")
          .select("model_id, order_index")
          .eq("program_id", programData.id)
          .order("order_index");

        if (pmData && pmData.length > 0) {
          const modelIds = pmData.map(pm => pm.model_id);
          const { data: modelsData } = await supabase
            .from("models")
            .select("id, name, steps")
            .in("id", modelIds);

          if (modelsData) {
            const modelsMap = Object.fromEntries(modelsData.map(m => [m.id, m]));
            for (const pm of pmData) {
              const model = modelsMap[pm.model_id];
              if (model?.steps && Array.isArray(model.steps)) {
                allSteps = allSteps.concat(
                  (model.steps as unknown as ModelStep[]).map(s => ({ ...s, _modelName: model.name }))
                );
              }
            }
          }
        } else if (programData.model_id) {
          const { data: modelData } = await supabase
            .from("models")
            .select("name, steps")
            .eq("id", programData.model_id)
            .single();

          if (modelData?.steps) {
            allSteps = (modelData.steps as unknown as ModelStep[]).map(s => ({ ...s, _modelName: modelData.name }));
          }
        }

        setSteps(allSteps);

        const { data: responseData } = await supabase
          .from("program_responses")
          .select("*")
          .eq("participant_id", participantData.id)
          .single();

        if (responseData) {
          setResponseId(responseData.id);
          setFormData((responseData.responses as Record<string, unknown>) || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code, navigate]);

  const handleSubmit = async () => {
    if (!responseId || !participantId) return;

    setSubmitting(true);

    try {
      await supabase
        .from("program_responses")
        .update({ submitted_at: new Date().toISOString() })
        .eq("id", responseId);

      await supabase
        .from("program_participants")
        .update({ status: 'submitted' })
        .eq("id", participantId);

      navigate(`/program/${code}/complete`);
    } catch (error: any) {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldValue = (field: ModelField, value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Not answered</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">No items</span>;
      }
      
      if (typeof value[0] === 'object' && field.columns) {
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {field.columns.map((col) => (
                    <th key={col.id} className="text-left p-2 font-medium">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row: Record<string, string>, i) => (
                  <tr key={i} className="border-b">
                    {field.columns!.map((col) => (
                      <td key={col.id} className="p-2">{row[col.id] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return <p className="whitespace-pre-wrap">{String(value)}</p>;
  };

  const isStepComplete = (step: ModelStep): boolean => {
    return step.fields.some(field => {
      const value = formData[field.id];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    });
  };

  if (loading) {
    return (
      <ProgramLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProgramLayout>
    );
  }

  return (
    <ProgramLayout programName={program?.name}>
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/program/${code}/workspace`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to editing
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Review Your Responses</h1>
          <p className="text-muted-foreground">
            Please review your answers before submitting. You can go back to edit if needed.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, stepIndex) => {
            const complete = isStepComplete(step);
            
            return (
              <Card key={step.id + '-' + stepIndex} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <CheckCircle className="h-5 w-5 text-chart-4" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      {step._modelName && (
                        <Badge variant="outline" className="text-xs">{step._modelName}</Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/program/${code}/workspace`)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {step.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                      <div className="text-sm">{renderFieldValue(field, formData[field.id])}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-primary/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5" />
                <span>
                  {steps.filter(isStepComplete).length} of {steps.length} sections completed
                </span>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full md:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Responses
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit your responses?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once submitted, you won't be able to make changes. 
                      Make sure you've reviewed all your answers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProgramLayout>
  );
}
