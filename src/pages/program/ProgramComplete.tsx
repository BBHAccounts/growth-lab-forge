import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProgramLayout } from "@/components/program/ProgramLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Download } from "lucide-react";
import { generateModelPDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

interface ModelStep {
  id: string;
  title: string;
  instruction: string;
  fields: Array<{ id: string; type: string; label: string; columns?: Array<{ id: string; label: string }> }>;
}

interface Program {
  id: string;
  name: string;
  model_id: string | null;
}

interface Model {
  name: string;
  emoji: string | null;
  steps: ModelStep[];
}

export default function ProgramComplete() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();

  const [program, setProgram] = useState<Program | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [participantName, setParticipantName] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!code) return;

      try {
        // Get participant
        const { data: participantData } = await supabase
          .from("program_participants")
          .select("*")
          .eq("access_code", code)
          .single();

        if (!participantData) return;

        setParticipantName(participantData.name || "");

        // Get program
        const { data: programData } = await supabase
          .from("programs")
          .select("*")
          .eq("id", participantData.program_id)
          .single();

        if (!programData) return;

        setProgram(programData);

        // Get model
        if (programData.model_id) {
          const { data: modelData } = await supabase
            .from("models")
            .select("name, emoji, steps")
            .eq("id", programData.model_id)
            .single();

          if (modelData) {
            setModel({
              name: modelData.name,
              emoji: modelData.emoji,
              steps: modelData.steps as unknown as ModelStep[],
            });
          }
        }

        // Get response
        const { data: responseData } = await supabase
          .from("program_responses")
          .select("responses")
          .eq("participant_id", participantData.id)
          .single();

        if (responseData?.responses) {
          setFormData(responseData.responses as Record<string, unknown>);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [code]);

  const handleDownloadPDF = () => {
    if (!model) return;

    generateModelPDF({
      modelName: model.name,
      emoji: model.emoji || "📋",
      steps: model.steps,
      formData,
    });

    toast({ title: "PDF downloaded" });
  };

  return (
    <ProgramLayout programName={program?.name}>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <Card className="border-2 border-chart-4/50">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-16 h-16 bg-chart-4/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-chart-4" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Thank You!</h1>
              {participantName && (
                <p className="text-muted-foreground">
                  {participantName}, your responses have been submitted successfully.
                </p>
              )}
              {!participantName && (
                <p className="text-muted-foreground">
                  Your responses have been submitted successfully.
                </p>
              )}
            </div>

            {model && (
              <div className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can download a copy of your responses for your records.
                </p>
                <Button onClick={handleDownloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Your Responses (PDF)
                </Button>
              </div>
            )}

            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                You can close this page now. If you need to make changes, please contact the organizer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProgramLayout>
  );
}
