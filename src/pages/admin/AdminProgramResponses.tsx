import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, GitCompare, Download } from 'lucide-react';

interface Participant {
  id: string;
  email: string | null;
  name: string | null;
  access_code: string;
  status: string;
  last_accessed_at: string | null;
}

interface Response {
  id: string;
  participant_id: string;
  responses: Record<string, unknown> | null;
  current_step: number | null;
  submitted_at: string | null;
}

interface Program {
  id: string;
  name: string;
  model_id: string | null;
}

interface ModelStep {
  id: string;
  title: string;
  fields: Array<{ id: string; label: string; type: string }>;
}

export default function AdminProgramResponses() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [modelSteps, setModelSteps] = useState<ModelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [viewingResponse, setViewingResponse] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;

      try {
        // Fetch program
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('id, name, model_id')
          .eq('id', programId)
          .single();

        if (programError || !programData) {
          toast({ title: 'Program not found', variant: 'destructive' });
          navigate('/admin/programs');
          return;
        }

        setProgram(programData);

        // Fetch model steps if linked
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

        // Fetch participants
        const { data: participantsData } = await supabase
          .from('program_participants')
          .select('*')
          .eq('program_id', programId)
          .order('created_at');

        setParticipants(participantsData || []);

        // Fetch responses
        const participantIds = (participantsData || []).map(p => p.id);
        if (participantIds.length > 0) {
          const { data: responsesData } = await supabase
            .from('program_responses')
            .select('*')
            .in('participant_id', participantIds);

          setResponses((responsesData || []).map(r => ({
            id: r.id,
            participant_id: r.participant_id,
            responses: r.responses as Record<string, unknown> | null,
            current_step: r.current_step,
            submitted_at: r.submitted_at,
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId, navigate, toast]);

  const getResponseForParticipant = (participantId: string) => {
    return responses.find(r => r.participant_id === participantId);
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleCompare = () => {
    if (selectedParticipants.length < 2) {
      toast({ title: 'Select at least 2 participants to compare', variant: 'destructive' });
      return;
    }
    navigate(`/admin/programs/${programId}/compare?participants=${selectedParticipants.join(',')}`);
  };

  const exportToCSV = () => {
    if (!modelSteps.length) {
      toast({ title: 'No model linked to export', variant: 'destructive' });
      return;
    }

    // Build CSV header
    const fieldLabels = modelSteps.flatMap(step => 
      step.fields.map(field => `${step.title} - ${field.label}`)
    );
    const headers = ['Name', 'Email', 'Status', 'Submitted At', ...fieldLabels];

    // Build CSV rows
    const rows = participants.map(participant => {
      const response = getResponseForParticipant(participant.id);
      const responseData = response?.responses || {};
      
      const fieldValues = modelSteps.flatMap(step =>
        step.fields.map(field => {
          const value = responseData[field.id];
          if (Array.isArray(value)) {
            return JSON.stringify(value);
          }
          return String(value || '');
        })
      );

      return [
        participant.name || '',
        participant.email || '',
        participant.status,
        response?.submitted_at ? new Date(response.submitted_at).toLocaleString() : '',
        ...fieldValues,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${program?.name || 'program'}-responses.csv`;
    link.click();

    toast({ title: 'CSV exported' });
  };

  const renderResponseValue = (value: unknown): string => {
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
          <div className="h-64 bg-muted rounded" />
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
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/programs/${programId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Responses</h1>
              <p className="text-muted-foreground">{program?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCompare}
              disabled={selectedParticipants.length < 2}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare ({selectedParticipants.length})
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedParticipants.length === participants.length}
                      onCheckedChange={(checked) => {
                        setSelectedParticipants(checked ? participants.map(p => p.id) : []);
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => {
                  const response = getResponseForParticipant(participant.id);
                  const progress = response ? `${response.current_step + 1}/${modelSteps.length || '?'}` : '0';
                  
                  return (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedParticipants.includes(participant.id)}
                          onCheckedChange={() => toggleParticipant(participant.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {participant.name || 'Anonymous'}
                      </TableCell>
                      <TableCell>{participant.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          participant.status === 'submitted' ? 'default' :
                          participant.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {participant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{progress}</TableCell>
                      <TableCell>
                        {participant.last_accessed_at 
                          ? new Date(participant.last_accessed_at).toLocaleString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingResponse(
                            viewingResponse === participant.id ? null : participant.id
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Response Detail View */}
        {viewingResponse && (
          <Card>
            <CardHeader>
              <CardTitle>
                Response: {participants.find(p => p.id === viewingResponse)?.name || 'Anonymous'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {modelSteps.length === 0 ? (
                <p className="text-muted-foreground">No model linked to view responses.</p>
              ) : (
                <div className="space-y-6">
                  {modelSteps.map((step) => (
                    <div key={step.id} className="space-y-3">
                      <h4 className="font-semibold text-lg">{step.title}</h4>
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {step.fields.map((field) => {
                          const response = getResponseForParticipant(viewingResponse);
                          const value = response?.responses?.[field.id];
                          
                          return (
                            <div key={field.id}>
                              <p className="text-sm text-muted-foreground">{field.label}</p>
                              <p className="whitespace-pre-wrap">{renderResponseValue(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
