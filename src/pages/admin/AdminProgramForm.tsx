import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Copy, Plus, Send, Trash2, Users, Link2, Mail, Search } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  emoji: string | null;
}

interface Participant {
  id: string;
  email: string | null;
  name: string | null;
  access_code: string;
  status: string;
  invited_at: string | null;
  last_accessed_at: string | null;
  user_id: string | null;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  model_id: string | null;
  deadline: string | null;
  status: string;
  allow_pdf_upload: boolean;
}

export default function AdminProgramForm() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = programId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ email: '', name: '' });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ user_id: string; full_name: string | null; email: string | null }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; full_name: string | null; email: string | null } | null>(null);

  const [formData, setFormData] = useState<Program>({
    id: '',
    name: '',
    description: '',
    model_id: null,
    deadline: null,
    status: 'draft',
    allow_pdf_upload: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch available models
      const { data: modelsData } = await supabase
        .from('models')
        .select('id, name, emoji')
        .eq('status', 'active')
        .order('name');
      
      setModels(modelsData || []);

      if (!isNew && programId) {
        // Fetch program
        const { data: program, error } = await supabase
          .from('programs')
          .select('*')
          .eq('id', programId)
          .single();

        if (error || !program) {
          toast({ title: 'Program not found', variant: 'destructive' });
          navigate('/admin/programs');
          return;
        }

        setFormData({
          id: program.id,
          name: program.name,
          description: program.description,
          model_id: program.model_id,
          deadline: program.deadline ? program.deadline.split('T')[0] : null,
          status: program.status,
          allow_pdf_upload: program.allow_pdf_upload || false,
        });

        // Fetch participants
        const { data: participantsData } = await supabase
          .from('program_participants')
          .select('*')
          .eq('program_id', programId)
          .order('created_at', { ascending: false });

        setParticipants(participantsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [programId, isNew, navigate, toast]);

  const generateAccessCode = () => {
    const prefix = formData.name.slice(0, 4).toLowerCase().replace(/[^a-z]/g, '') || 'prog';
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${random}`;
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      
      // Filter out users already in participants
      const existingUserIds = participants.filter(p => p.user_id).map(p => p.user_id);
      setSearchResults((data || []).filter(u => !existingUserIds.includes(u.user_id)));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddExistingUser = async () => {
    if (!programId || !selectedUser) return;
    setSendingInvite(true);
    try {
      const accessCode = generateAccessCode();
      const { data: participant, error } = await supabase
        .from('program_participants')
        .insert({
          program_id: programId,
          user_id: selectedUser.user_id,
          email: selectedUser.email,
          name: selectedUser.full_name,
          access_code: accessCode,
          status: 'invited',
        })
        .select()
        .single();

      if (error) throw error;
      setParticipants([participant, ...participants]);
      setSelectedUser(null);
      setUserSearch('');
      setSearchResults([]);
      setShowAddParticipant(false);
      toast({ title: 'User added to program' });
    } catch (error: any) {
      toast({ title: 'Error adding user', description: error.message, variant: 'destructive' });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const programData = {
        name: formData.name,
        description: formData.description,
        model_id: formData.model_id,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: formData.status,
        allow_pdf_upload: formData.allow_pdf_upload,
        created_by: user?.id,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('programs')
          .insert(programData)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Program created' });
        navigate(`/admin/programs/${data.id}`);
      } else {
        const { error } = await supabase
          .from('programs')
          .update(programData)
          .eq('id', programId);

        if (error) throw error;
        toast({ title: 'Program updated' });
      }
    } catch (error: any) {
      toast({ title: 'Error saving program', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!programId) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      toast({ title: 'Error deleting program', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Program deleted' });
      navigate('/admin/programs');
    }
  };

  const handleAddParticipant = async (sendEmail: boolean) => {
    if (!programId) return;
    if (!newParticipant.email && !newParticipant.name) {
      toast({ title: 'Email or name is required', variant: 'destructive' });
      return;
    }

    setSendingInvite(true);

    try {
      const accessCode = generateAccessCode();
      
      const { data: participant, error } = await supabase
        .from('program_participants')
        .insert({
          program_id: programId,
          email: newParticipant.email || null,
          name: newParticipant.name || null,
          access_code: accessCode,
          status: 'invited',
          invited_at: sendEmail ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      if (sendEmail && newParticipant.email) {
        // Send invite email
        const { error: emailError } = await supabase.functions.invoke('send-program-invite', {
          body: {
            email: newParticipant.email,
            name: newParticipant.name,
            program_name: formData.name,
            access_code: accessCode,
          },
        });

        if (emailError) {
          console.error('Email error:', emailError);
          toast({ 
            title: 'Participant added but email failed', 
            description: 'You can share the link manually.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Invite sent successfully' });
        }
      } else {
        toast({ title: 'Participant added' });
      }

      setParticipants([participant, ...participants]);
      setNewParticipant({ email: '', name: '' });
      setShowAddParticipant(false);
    } catch (error: any) {
      toast({ title: 'Error adding participant', description: error.message, variant: 'destructive' });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from('program_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      toast({ title: 'Error removing participant', description: error.message, variant: 'destructive' });
    } else {
      setParticipants(participants.filter(p => p.id !== participantId));
      toast({ title: 'Participant removed' });
    }
  };

  const copyAccessLink = (accessCode: string) => {
    const link = `${window.location.origin}/program/${accessCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied to clipboard' });
  };

  const generateShareableLink = async () => {
    if (!programId) return;

    const accessCode = generateAccessCode();
    
    const { error } = await supabase
      .from('program_participants')
      .insert({
        program_id: programId,
        access_code: accessCode,
        status: 'invited',
      });

    if (error) {
      toast({ title: 'Error generating link', description: error.message, variant: 'destructive' });
      return;
    }

    const link = `${window.location.origin}/program/${accessCode}`;
    setShareableLink(link);
    navigator.clipboard.writeText(link);
    toast({ title: 'Shareable link created and copied!' });

    // Refresh participants
    const { data } = await supabase
      .from('program_participants')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false });
    
    setParticipants(data || []);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/programs')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Create Program' : 'Edit Program'}</h1>
              <p className="text-muted-foreground">
                {isNew ? 'Set up a new pre-work assignment' : formData.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Program?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this program and all participant data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Program'}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>Basic information about the program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Partner Strategy Day Pre-Work"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Instructions</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instructions participants will see when starting the program..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Linked Model</Label>
                <Select
                  value={formData.model_id || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, model_id: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No model linked</SelectItem>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.emoji} {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="block mb-3">Settings</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.allow_pdf_upload}
                    onCheckedChange={(checked) => setFormData({ ...formData, allow_pdf_upload: checked })}
                  />
                  <span className="text-sm">Allow PDF uploads</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants - only show for existing programs */}
        {!isNew && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants
                  </CardTitle>
                  <CardDescription>
                    {participants.length} participant{participants.length !== 1 ? 's' : ''} • 
                    {participants.filter(p => p.status === 'submitted').length} submitted
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={generateShareableLink}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Create Shareable Link
                  </Button>
                  <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Participant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Participant</DialogTitle>
                        <DialogDescription>
                          Add a participant and optionally send them an email invite.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="participant-email">Email</Label>
                          <Input
                            id="participant-email"
                            type="email"
                            value={newParticipant.email}
                            onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                            placeholder="participant@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="participant-name">Name</Label>
                          <Input
                            id="participant-name"
                            value={newParticipant.name}
                            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleAddParticipant(false)}
                          disabled={sendingInvite}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Add (share link later)
                        </Button>
                        <Button
                          onClick={() => handleAddParticipant(true)}
                          disabled={sendingInvite || !newParticipant.email}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendingInvite ? 'Sending...' : 'Send Email Invite'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shareableLink && (
                <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs">{shareableLink}</code>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(shareableLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {participants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No participants yet. Add participants or create a shareable link.
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {participant.name || participant.email || 'Anonymous link'}
                          </p>
                          {participant.name && participant.email && (
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          participant.status === 'submitted' ? 'default' :
                          participant.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {participant.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyAccessLink(participant.access_code)}
                          title="Copy access link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          title="Remove participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {participants.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/admin/programs/${programId}/responses`)}
                  >
                    View All Responses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
