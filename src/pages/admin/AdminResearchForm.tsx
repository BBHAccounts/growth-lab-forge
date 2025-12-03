import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Trash2, Plus, X, Eye } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'single-choice' | 'multi-choice' | 'scale';
  options?: string[];
  required?: boolean;
}

interface Study {
  id?: string;
  title: string;
  slug: string;
  description: string;
  emoji: string;
  active: boolean;
  estimated_time: number | null;
  reward_description: string;
  target_audience_tags: string[];
  questions: Question[];
}

const defaultStudy: Study = {
  title: '',
  slug: '',
  description: '',
  emoji: '🧪',
  active: false,
  estimated_time: null,
  reward_description: '',
  target_audience_tags: [],
  questions: [],
};

export default function AdminResearchForm() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = studyId === 'new';

  const [study, setStudy] = useState<Study>(defaultStudy);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isNew && studyId) {
      const fetchStudy = async () => {
        try {
          const { data, error } = await supabase
            .from('research_studies')
            .select('*')
            .eq('id', studyId)
            .single();

          if (error) throw error;
          
          setStudy({
            ...defaultStudy,
            ...data,
            questions: (data.questions as unknown as Question[]) || [],
            target_audience_tags: data.target_audience_tags || [],
          });
        } catch (error) {
          console.error('Error fetching study:', error);
          toast({
            title: 'Error',
            description: 'Failed to load study',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };

      fetchStudy();
    }
  }, [studyId, isNew, toast]);

  const handleSave = async () => {
    if (!study.title.trim()) {
      toast({
        title: 'Error',
        description: 'Study title is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const studyData = {
        title: study.title,
        slug: study.slug || study.title.toLowerCase().replace(/\s+/g, '-'),
        description: study.description,
        emoji: study.emoji,
        active: study.active,
        estimated_time: study.estimated_time,
        reward_description: study.reward_description,
        target_audience_tags: study.target_audience_tags,
        questions: study.questions as unknown as Record<string, unknown>[],
      };

      if (isNew) {
        const { error } = await supabase.from('research_studies').insert([studyData]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Study created successfully' });
      } else {
        const { error } = await supabase
          .from('research_studies')
          .update(studyData)
          .eq('id', studyId);
        if (error) throw error;
        toast({ title: 'Success', description: 'Study updated successfully' });
      }

      navigate('/admin/research');
    } catch (error) {
      console.error('Error saving study:', error);
      toast({
        title: 'Error',
        description: 'Failed to save study',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !studyId) return;

    try {
      const { error } = await supabase.from('research_studies').delete().eq('id', studyId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Study deleted successfully' });
      navigate('/admin/research');
    } catch (error) {
      console.error('Error deleting study:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete study',
        variant: 'destructive',
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: 'text',
      options: [],
      required: false,
    };
    setStudy({ ...study, questions: [...study.questions, newQuestion] });
  };

  const removeQuestion = (id: string) => {
    setStudy({
      ...study,
      questions: study.questions.filter((q) => q.id !== id),
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setStudy({
      ...study,
      questions: study.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/research')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Create Study' : 'Edit Study'}</h1>
              <p className="text-muted-foreground">
                {isNew ? 'Create a new research study' : study.title}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && (
              <>
                <Button variant="outline" onClick={() => navigate(`/admin/research/${studyId}/responses`)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Responses
                </Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <Input
                    value={study.emoji}
                    onChange={(e) => setStudy({ ...study, emoji: e.target.value })}
                    className="text-center text-xl"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={study.title}
                    onChange={(e) => setStudy({ ...study, title: e.target.value })}
                    placeholder="Study title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={study.slug}
                  onChange={(e) => setStudy({ ...study, slug: e.target.value })}
                  placeholder="study-slug"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={study.description}
                  onChange={(e) => setStudy({ ...study, description: e.target.value })}
                  placeholder="Study description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated Time (minutes)</Label>
                <Input
                  type="number"
                  value={study.estimated_time || ''}
                  onChange={(e) => setStudy({ ...study, estimated_time: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label>Reward Description</Label>
                <Input
                  value={study.reward_description}
                  onChange={(e) => setStudy({ ...study, reward_description: e.target.value })}
                  placeholder="e.g., Unlock premium models"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Visible to users</p>
                </div>
                <Switch
                  checked={study.active}
                  onCheckedChange={(checked) => setStudy({ ...study, active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {study.questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No questions yet. Click "Add Question" to create one.
                </p>
              ) : (
                study.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 rounded-lg border bg-muted/30 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Question {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Question Text</Label>
                        <Input
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                          placeholder="Enter your question"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(question.id, { type: value as Question['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="single-choice">Single Choice</SelectItem>
                            <SelectItem value="multi-choice">Multiple Choice</SelectItem>
                            <SelectItem value="scale">Scale (1-10)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.required}
                          onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                        />
                        <Label>Required</Label>
                      </div>

                      {(question.type === 'single-choice' || question.type === 'multi-choice') && (
                        <div className="space-y-2 md:col-span-2">
                          <Label>Options (comma-separated)</Label>
                          <Input
                            value={(question.options || []).join(', ')}
                            onChange={(e) => updateQuestion(question.id, {
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                            })}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/research')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : isNew ? 'Create Study' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Study"
        description="Are you sure you want to delete this study? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
