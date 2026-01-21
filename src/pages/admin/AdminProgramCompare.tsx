import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download } from 'lucide-react';

interface Participant {
  id: string;
  email: string | null;
  name: string | null;
}

interface Response {
  participant_id: string;
  responses: Record<string, unknown> | null;
}

interface ModelStep {
  id: string;
  title: string;
  fields: Array<{ id: string; label: string; type: string }>;
}

interface Program {
  id: string;
  name: string;
  model_id: string | null;
}

export default function AdminProgramCompare() {
  const { programId } = useParams<{ programId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [modelSteps, setModelSteps] = useState<ModelStep[]>([]);
  const [loading, setLoading] = useState(true);

  const participantIds = searchParams.get('participants')?.split(',') || [];

  useEffect(() => {
    const fetchData = async () => {
      if (!programId || participantIds.length === 0) {
        navigate(`/admin/programs/${programId}/responses`);
        return;
      }

      try {
        // Fetch program
        const { data: programData } = await supabase
          .from('programs')
          .select('id, name, model_id')
          .eq('id', programId)
          .single();

        if (!programData) {
          navigate('/admin/programs');
          return;
        }

        setProgram(programData);

        // Fetch model steps
        if (programData.model_id) {
          const { data: modelData } = await supabase
            .from('models')
            .select('steps')
            .eq('id', programData.model_id)
            .single();

          if (modelData?.steps) {
            setModelSteps(modelData.steps as unknown as ModelStep[]);
          }
        }

        // Fetch selected participants
        const { data: participantsData } = await supabase
          .from('program_participants')
          .select('id, email, name')
          .in('id', participantIds);

        setParticipants(participantsData || []);

        // Fetch their responses
        const { data: responsesData } = await supabase
          .from('program_responses')
          .select('participant_id, responses')
          .in('participant_id', participantIds);

        setResponses((responsesData || []).map(r => ({
          participant_id: r.participant_id,
          responses: r.responses as Record<string, unknown> | null,
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId, participantIds.length, navigate]);

  const getResponseValue = (participantId: string, fieldId: string): string => {
    const response = responses.find(r => r.participant_id === participantId);
    if (!response?.responses) return '-';
    
    const value = response.responses[fieldId];
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      if (typeof value[0] === 'object') {
        return value.map(row => Object.values(row).join(' | ')).join('\n');
      }
      return value.join(', ');
    }
    return String(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse p-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/admin/programs/${programId}/responses`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Compare Responses</h1>
              <p className="text-muted-foreground">
                {program?.name} • Comparing {participants.length} participants
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                {/* Header Row - Participant Names */}
                <div 
                  className="grid border-b bg-muted/50 sticky top-0 z-10"
                  style={{ gridTemplateColumns: `250px repeat(${participants.length}, 1fr)` }}
                >
                  <div className="p-4 font-semibold border-r">Question</div>
                  {participants.map((participant) => (
                    <div key={participant.id} className="p-4 font-semibold border-r last:border-r-0">
                      {participant.name || participant.email || 'Anonymous'}
                    </div>
                  ))}
                </div>

                {/* Data Rows */}
                {modelSteps.map((step) => (
                  <div key={step.id}>
                    {/* Step Header */}
                    <div 
                      className="grid bg-muted/30"
                      style={{ gridTemplateColumns: `250px repeat(${participants.length}, 1fr)` }}
                    >
                      <div className="p-3 font-semibold text-primary col-span-full border-b">
                        {step.title}
                      </div>
                    </div>

                    {/* Step Fields */}
                    {step.fields.map((field) => (
                      <div 
                        key={field.id}
                        className="grid border-b hover:bg-muted/20"
                        style={{ gridTemplateColumns: `250px repeat(${participants.length}, 1fr)` }}
                      >
                        <div className="p-4 border-r text-sm text-muted-foreground">
                          {field.label}
                        </div>
                        {participants.map((participant) => (
                          <div 
                            key={participant.id} 
                            className="p-4 border-r last:border-r-0 text-sm whitespace-pre-wrap"
                          >
                            {getResponseValue(participant.id, field.id)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
