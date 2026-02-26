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
import { ArrowLeft, ArrowUp, ArrowDown, Copy, Plus, Send, Trash2, Users, Link2, Mail, Search, GripVertical } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  emoji: string | null;
}

interface ProgramModel {
  id?: string;
  model_id: string;
  order_index: number;
  deadline: string | null;
  model?: Model;
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
  deadline: string | null;
  status: string;
  allow_pdf_upload: boolean;
  sequential: boolean;
}

export default function AdminProgramForm() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = programId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [programModels, setProgramModels] = useState<ProgramModel[]>([]);
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
    deadline: null,
    status: 'draft',
    allow_pdf_upload: false,
    sequential: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch available models
      const { data: modelsData } = await supabase
        .from('models')
        .select('id, name, emoji')
        .eq('status', 'active')
        .order('name');
      
      setAllModels(modelsData || []);

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
          deadline: program.deadline ? program.deadline.split('T')[0] : null,
          status: program.status,
          allow_pdf_upload: program.allow_pdf_upload || false,
          sequential: program.sequential ?? true,
        });

        // Fetch program models
        const { data: pmData } = await supabase
          .from('program_models')
          .select('id, model_id, order_index, deadline')
          .eq('program_id', programId)
          .order('order_index');

        if (pmData && pmData.length > 0 && modelsData) {
          const modelsMap = Object.fromEntries((modelsData || []).map(m => [m.id, m]));
          setProgramModels(pmData.map(pm => ({
            ...pm,
            deadline: pm.deadline ? pm.deadline.split('T')[0] : null,
            model: modelsMap[pm.model_id],
          })));
        }

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

  // --- Model management ---
  const addModelToProgram = (modelId: string) => {
    if (programModels.some(pm => pm.model_id === modelId)) return;
    const model = allModels.find(m => m.id === modelId);
    setProgramModels(prev => [
      ...prev,
      { model_id: modelId, order_index: prev.length, deadline: null, model },
    ]);
  };

  const removeModelFromProgram = (index: number) => {
    setProgramModels(prev => prev.filter((_, i) => i !== index).map((pm, i) => ({ ...pm, order_index: i })));
  };

  const moveModel = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= programModels.length) return;
    const updated = [...programModels];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setProgramModels(updated.map((pm, i) => ({ ...pm, order_index: i })));
  };

  const updateModelDeadline = (index: number, deadline: string | null) => {
    setProgramModels(prev => prev.map((pm, i) => i === index ? { ...pm, deadline } : pm));
  };

  const availableModels = allModels.filter(m => !programModels.some(pm => pm.model_id === m.id));

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
        model_id: programModels.length > 0 ? programModels[0].model_id : null, // keep backward compat
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: formData.status,
        allow_pdf_upload: formData.allow_pdf_upload,
        sequential: formData.sequential,
        created_by: user?.id,
      };

      let savedProgramId = programId;

      if (isNew) {
        const { data, error } = await supabase
          .from('programs')
          .insert(programData)
          .select()
          .single();

        if (error) throw error;
        savedProgramId = data.id;
      } else {
        const { error } = await supabase
          .from('programs')
          .update(programData)
          .eq('id', programId);

        if (error) throw error;
      }

      // Save program_models: delete existing and re-insert
      if (savedProgramId) {
        await supabase
          .from('program_models')
          .delete()
          .eq('program_id', savedProgramId);

        if (programModels.length > 0) {
          const { error: pmError } = await supabase
            .from('program_models')
            .insert(
              programModels.map((pm, i) => ({
                program_id: savedProgramId!,
                model_id: pm.model_id,
                order_index: i,
                deadline: pm.deadline ? new Date(pm.deadline).toISOString() : null,
              }))
            );
          if (pmError) throw pmError;
        }
      }

      toast({ title: isNew ? 'Program created' : 'Program updated' });
      if (isNew) {
        navigate(`/admin/programs/${savedProgramId}`);
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

              <div className="space-y-2">
                <Label htmlFor="deadline">Programme Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label className="block mb-3">Task Order</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.sequential}
                    onCheckedChange={(checked) => setFormData({ ...formData, sequential: checked })}
                  />
                  <span className="text-sm">{formData.sequential ? 'Sequential (must complete in order)' : 'Flexible (any order)'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Models / Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks (Models)</CardTitle>
                <CardDescription>
                  Add models as tasks in this programme. {programModels.length} task{programModels.length !== 1 ? 's' : ''} added.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing models list */}
            {programModels.length > 0 && (
              <div className="space-y-2">
                {programModels.map((pm, index) => (
                  <div
                    key={pm.model_id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => moveModel(index, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === programModels.length - 1}
                        onClick={() => moveModel(index, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <Badge variant="outline" className="shrink-0 font-mono text-xs">
                      {index + 1}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {pm.model?.emoji} {pm.model?.name || 'Unknown model'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="date"
                        value={pm.deadline || ''}
                        onChange={(e) => updateModelDeadline(index, e.target.value || null)}
                        className="w-40 text-xs"
                        placeholder="Deadline"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeModelFromProgram(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add model */}
            {availableModels.length > 0 ? (
              <div className="flex items-center gap-2">
                <Select onValueChange={(v) => addModelToProgram(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add a model as task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.emoji} {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : programModels.length > 0 ? (
              <p className="text-sm text-muted-foreground">All available models have been added.</p>
            ) : (
              <p className="text-sm text-muted-foreground">No active models available. Create models first.</p>
            )}
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
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Participant</DialogTitle>
                        <DialogDescription>
                          Add an existing user or a new participant.
                        </DialogDescription>
                      </DialogHeader>
                      
                      {/* Mode Toggle */}
                      <div className="flex gap-2 border-b pb-3">
                        <Button
                          variant={addMode === 'existing' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setAddMode('existing'); setSelectedUser(null); }}
                        >
                          <Search className="h-4 w-4 mr-1.5" />
                          Existing User
                        </Button>
                        <Button
                          variant={addMode === 'new' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAddMode('new')}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          New Participant
                        </Button>
                      </div>

                      {addMode === 'existing' ? (
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Search by name or email</Label>
                            <Input
                              value={userSearch}
                              onChange={(e) => handleSearchUsers(e.target.value)}
                              placeholder="Type to search..."
                            />
                          </div>
                          {searchLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
                          {searchResults.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                              {searchResults.map(user => (
                                <button
                                  key={user.user_id}
                                  onClick={() => setSelectedUser(user)}
                                  className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${
                                    selectedUser?.user_id === user.user_id
                                      ? 'bg-primary/10 border border-primary/30'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  <p className="font-medium">{user.full_name || 'No name'}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          {userSearch.length >= 2 && !searchLoading && searchResults.length === 0 && (
                            <p className="text-sm text-muted-foreground">No users found.</p>
                          )}
                          <DialogFooter>
                            <Button
                              onClick={handleAddExistingUser}
                              disabled={!selectedUser || sendingInvite}
                            >
                              {sendingInvite ? 'Adding...' : 'Add to Program'}
                            </Button>
                          </DialogFooter>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4 py-2">
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
                        </>
                      )}
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
