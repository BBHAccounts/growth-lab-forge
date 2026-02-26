import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ProgramLayout } from "@/components/program/ProgramLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, FileText } from "lucide-react";

interface Program {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  model_id: string | null;
  allow_pdf_upload: boolean;
}

interface Participant {
  id: string;
  email: string | null;
  name: string | null;
  program_id: string;
  status: string;
}

interface ProgramModelInfo {
  model_id: string;
  order_index: number;
  deadline: string | null;
  name: string;
  emoji: string | null;
  stepCount: number;
}

export default function ProgramLanding() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [needsInfo, setNeedsInfo] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });

  // Support both /program/:code and /program?code=xxx
  const accessCode = code || searchParams.get('code');

  useEffect(() => {
    const validateAccess = async () => {
      if (!accessCode) {
        toast({ title: "Invalid access link", variant: "destructive" });
        navigate("/");
        return;
      }

      try {
        // Find participant by access code
        const { data: participantData, error: participantError } = await supabase
          .from("program_participants")
          .select("*")
          .eq("access_code", accessCode)
          .single();

        if (participantError || !participantData) {
          toast({ title: "Invalid or expired access code", variant: "destructive" });
          navigate("/");
          return;
        }

        setParticipant(participantData);

        // Check if we need to collect user info
        if (!participantData.name && !participantData.email) {
          setNeedsInfo(true);
        }

        // Fetch program
        const { data: programData, error: programError } = await supabase
          .from("programs")
          .select("*")
          .eq("id", participantData.program_id)
          .single();

        if (programError || !programData) {
          toast({ title: "Program not found", variant: "destructive" });
          navigate("/");
          return;
        }

        if (programData.status !== 'active') {
          toast({ title: "This program is not currently active", variant: "destructive" });
          navigate("/");
          return;
        }

        setProgram(programData);

        // Fetch model if linked
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
              steps: Array.isArray(modelData.steps) ? modelData.steps : [],
            });
          }
        }

        // Update last accessed
        await supabase
          .from("program_participants")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("id", participantData.id);

      } catch (error) {
        console.error("Error validating access:", error);
        toast({ title: "Something went wrong", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [accessCode, navigate, toast]);

  const handleStart = async () => {
    if (!participant || !program) return;

    setSubmitting(true);

    try {
      // If we need info, update participant first
      if (needsInfo) {
        if (!userInfo.name.trim()) {
          toast({ title: "Please enter your name", variant: "destructive" });
          setSubmitting(false);
          return;
        }

        await supabase
          .from("program_participants")
          .update({ 
            name: userInfo.name,
            email: userInfo.email || null,
            status: 'in_progress',
          })
          .eq("id", participant.id);
      } else {
        // Just update status
        await supabase
          .from("program_participants")
          .update({ status: 'in_progress' })
          .eq("id", participant.id);
      }

      // Check if response record exists, create if not
      const { data: existingResponse } = await supabase
        .from("program_responses")
        .select("id")
        .eq("participant_id", participant.id)
        .single();

      if (!existingResponse) {
        await supabase
          .from("program_responses")
          .insert({
            participant_id: participant.id,
            responses: {},
            current_step: 0,
          });
      }

      // Navigate to workspace
      navigate(`/program/${accessCode}/workspace`);
    } catch (error: any) {
      console.error("Error starting program:", error);
      toast({ title: "Error starting program", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProgramLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20" />
            <p className="text-muted-foreground">Loading program...</p>
          </div>
        </div>
      </ProgramLayout>
    );
  }

  if (!program) {
    return (
      <ProgramLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Program not found</p>
        </div>
      </ProgramLayout>
    );
  }

  const stepCount = model?.steps?.length || 0;

  return (
    <ProgramLayout programName={program.name}>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            {model?.emoji && (
              <div className="text-5xl mb-4">{model.emoji}</div>
            )}
            <CardTitle className="text-2xl md:text-3xl">{program.name}</CardTitle>
            {model && (
              <p className="text-muted-foreground">{model.name}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            {program.description && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{program.description}</p>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              {stepCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{stepCount} steps</p>
                    <p className="text-xs text-muted-foreground">to complete</p>
                  </div>
                </div>
              )}
              {program.deadline && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(program.deadline).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">deadline</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Info Form (if needed) */}
            {needsInfo && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Please enter your details to get started:
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Welcome message if name is known */}
            {!needsInfo && participant?.name && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm">
                  Welcome, <strong>{participant.name}</strong>! 
                  Click below to start or continue your assignment.
                </p>
              </div>
            )}

            {/* Start Button */}
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleStart}
              disabled={submitting}
            >
              {submitting ? 'Starting...' : (
                <>
                  {participant?.status === 'in_progress' ? 'Continue' : 'Start'} Assignment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProgramLayout>
  );
}
