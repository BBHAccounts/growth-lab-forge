import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download } from 'lucide-react';

interface Response {
  id: string;
  user_id: string;
  responses: Record<string, unknown>;
  completed: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface Study {
  id: string;
  title: string;
  questions: { id: string; text: string; type: string }[];
}

export default function AdminResearchResponses() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [study, setStudy] = useState<Study | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!studyId) return;

      try {
        // Fetch study
        const { data: studyData, error: studyError } = await supabase
          .from('research_studies')
          .select('id, title, questions')
          .eq('id', studyId)
          .single();

        if (studyError) throw studyError;
        setStudy({
          ...studyData,
          questions: (studyData.questions as unknown as Study['questions']) || [],
        });

        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('research_responses')
          .select('*')
          .eq('study_id', studyId)
          .order('created_at', { ascending: false });

        if (responsesError) throw responsesError;

        // Fetch user info for each response
        const responsesWithUsers = await Promise.all(
          (responsesData || []).map(async (response) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('user_id', response.user_id)
              .single();

            return {
              ...response,
              responses: (response.responses as Record<string, unknown>) || {},
              user_email: profile?.email || 'Unknown',
              user_name: profile?.full_name || 'Unknown',
            };
          })
        );

        setResponses(responsesWithUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load responses',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studyId, toast]);

  const exportToCSV = () => {
    if (!study || responses.length === 0) return;

    const headers = ['User', 'Email', 'Completed', 'Date', ...study.questions.map(q => q.text)];
    const rows = responses.map(response => [
      response.user_name,
      response.user_email,
      response.completed ? 'Yes' : 'No',
      new Date(response.created_at).toLocaleString(),
      ...study.questions.map(q => {
        const answer = response.responses[q.id];
        if (Array.isArray(answer)) return answer.join('; ');
        return answer?.toString() || '';
      }),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${study.title.replace(/\s+/g, '_')}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading...</p>
      </AdminLayout>
    );
  }

  if (!study) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Study not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/research/${studyId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Responses</h1>
              <p className="text-muted-foreground">{study.title}</p>
            </div>
          </div>
          <Button onClick={exportToCSV} disabled={responses.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responses.filter(r => r.completed).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responses.length > 0
                  ? Math.round((responses.filter(r => r.completed).length / responses.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses List */}
        <Card>
          <CardHeader>
            <CardTitle>All Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No responses yet
              </p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="p-4 rounded-lg border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{response.user_name}</p>
                        <p className="text-sm text-muted-foreground">{response.user_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {response.completed ? '✅ Completed' : '⏳ In Progress'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(response.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      {study.questions.map((question) => (
                        <div key={question.id} className="text-sm">
                          <p className="text-muted-foreground">{question.text}</p>
                          <p className="font-medium">
                            {(() => {
                              const answer = response.responses[question.id];
                              if (!answer) return '-';
                              if (Array.isArray(answer)) return answer.join(', ');
                              return answer.toString();
                            })()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
