import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProgramLayout } from "@/components/program/ProgramLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Save, Plus, Trash2, X, LogOut } from "lucide-react";
import { FieldAssistant } from "@/components/FieldAssistant";

interface ModelField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
  columns?: Array<{ id: string; label: string }>;
}

interface ModelStep {
  id: string;
  title: string;
  instruction: string;
  fields: ModelField[];
  _modelId?: string; // track which model this step belongs to
  _modelName?: string;
}

interface Program {
  id: string;
  name: string;
  model_id: string | null;
  allow_pdf_upload: boolean;
  sequential: boolean;
}

interface Participant {
  id: string;
  name: string | null;
}

export default function ProgramWorkspace() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [program, setProgram] = useState<Program | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [steps, setSteps] = useState<ModelStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [responseId, setResponseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!code) {
        navigate("/");
        return;
      }

      try {
        const { data: participantData, error: participantError } = await supabase
          .from("program_participants")
          .select("*")
          .eq("access_code", code)
          .single();

        if (participantError || !participantData) {
          toast({ title: "Invalid access code", variant: "destructive" });
          navigate("/");
          return;
        }

        setParticipant(participantData);

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

        // Load steps from program_models (multi-model) or fallback to model_id
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
            .select("id, name, emoji, steps")
            .in("id", modelIds);

          if (modelsData) {
            const modelsMap = Object.fromEntries(modelsData.map(m => [m.id, m]));
            for (const pm of pmData) {
              const model = modelsMap[pm.model_id];
              if (model?.steps && Array.isArray(model.steps)) {
                const modelSteps = (model.steps as unknown as ModelStep[]).map(s => ({
                  ...s,
                  _modelId: model.id,
                  _modelName: model.name,
                }));
                allSteps = allSteps.concat(modelSteps);
              }
            }
          }
        } else if (programData.model_id) {
          // Fallback to legacy single model
          const { data: modelData } = await supabase
            .from("models")
            .select("id, name, steps")
            .eq("id", programData.model_id)
            .single();

          if (modelData?.steps) {
            allSteps = (modelData.steps as unknown as ModelStep[]).map(s => ({
              ...s,
              _modelId: modelData.id,
              _modelName: modelData.name,
            }));
          }
        }

        setSteps(allSteps);

        // Get existing response
        const { data: responseData } = await supabase
          .from("program_responses")
          .select("*")
          .eq("participant_id", participantData.id)
          .single();

        if (responseData) {
          setResponseId(responseData.id);
          setFormData((responseData.responses as Record<string, unknown>) || {});
          setCurrentStep(responseData.current_step || 0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code, navigate, toast]);

  // Auto-save functionality
  const saveProgress = useCallback(async (data: Record<string, unknown>, step: number) => {
    if (!responseId) return;

    setSaving(true);
    setAutoSaveStatus('saving');

    const { error } = await supabase
      .from("program_responses")
      .update({
        responses: data as unknown as null,
        current_step: step,
        auto_saved_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    setSaving(false);
    
    if (error) {
      setAutoSaveStatus('unsaved');
      console.error("Auto-save error:", error);
    } else {
      setAutoSaveStatus('saved');
    }
  }, [responseId]);

  useEffect(() => {
    if (!responseId) return;
    
    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      saveProgress(formData, currentStep);
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, currentStep, responseId, saveProgress]);

  const handleManualSave = async () => {
    await saveProgress(formData, currentStep);
    toast({ title: "Progress saved" });
  };

  const handleNext = async () => {
    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    await saveProgress(formData, nextStep);
    setCurrentStep(nextStep);
  };

  const handlePrev = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleReview = async () => {
    await saveProgress(formData, currentStep);
    navigate(`/program/${code}/review`);
  };

  const handleExit = async () => {
    await saveProgress(formData, currentStep);
    toast({ title: "Progress saved" });
    navigate("/programmes");
  };

  const updateFieldValue = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const addListItem = (fieldId: string) => {
    const current = (formData[fieldId] as string[]) || [];
    updateFieldValue(fieldId, [...current, ""]);
  };

  const updateListItem = (fieldId: string, index: number, value: string) => {
    const current = (formData[fieldId] as string[]) || [];
    const updated = [...current];
    updated[index] = value;
    updateFieldValue(fieldId, updated);
  };

  const removeListItem = (fieldId: string, index: number) => {
    const current = (formData[fieldId] as string[]) || [];
    updateFieldValue(fieldId, current.filter((_, i) => i !== index));
  };

  const addTableRow = (fieldId: string, columns: Array<{ id: string }>) => {
    const current = (formData[fieldId] as Record<string, string>[]) || [];
    const emptyRow = columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {});
    updateFieldValue(fieldId, [...current, emptyRow]);
  };

  const updateTableCell = (fieldId: string, rowIndex: number, colId: string, value: string) => {
    const current = (formData[fieldId] as Record<string, string>[]) || [];
    const updated = [...current];
    updated[rowIndex] = { ...updated[rowIndex], [colId]: value };
    updateFieldValue(fieldId, updated);
  };

  const removeTableRow = (fieldId: string, index: number) => {
    const current = (formData[fieldId] as Record<string, string>[]) || [];
    updateFieldValue(fieldId, current.filter((_, i) => i !== index));
  };

  const renderField = (field: ModelField) => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={(formData[field.id] as string) || ""}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="resize-none"
          />
        );

      case "list":
        const listItems = (formData[field.id] as string[]) || [];
        return (
          <div className="space-y-2">
            {listItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateListItem(field.id, i, e.target.value)}
                  placeholder={field.placeholder}
                />
                <Button variant="ghost" size="icon" onClick={() => removeListItem(field.id, i)} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addListItem(field.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add item
            </Button>
          </div>
        );

      case "table":
        const tableRows = (formData[field.id] as Record<string, string>[]) || [];
        const columns = field.columns || [];
        return (
          <div className="space-y-2">
            {columns.length > 0 && (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 40px` }}>
                {columns.map((col) => (
                  <Label key={col.id} className="text-xs text-muted-foreground">{col.label}</Label>
                ))}
                <div />
              </div>
            )}
            {tableRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 40px` }}>
                {columns.map((col) => (
                  <Input key={col.id} value={row[col.id] || ""} onChange={(e) => updateTableCell(field.id, rowIndex, col.id, e.target.value)} placeholder={col.label} />
                ))}
                <Button variant="ghost" size="icon" onClick={() => removeTableRow(field.id, rowIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addTableRow(field.id, columns)}>
              <Plus className="h-4 w-4 mr-2" />
              Add row
            </Button>
          </div>
        );

      default:
        return (
          <Input
            value={(formData[field.id] as string) || ""}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (loading || !program || steps.length === 0) {
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

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentModelId = step._modelId || program.model_id;

  return (
    <ProgramLayout programName={program.name}>
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">
              Step {currentStep + 1} of {steps.length}
            </h1>
            <div className="flex items-center gap-2">
              {participant?.name && (
                <p className="text-sm text-muted-foreground">{participant.name}</p>
              )}
              {step._modelName && (
                <Badge variant="outline" className="text-xs">{step._modelName}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              autoSaveStatus === 'saved' ? 'secondary' : 
              autoSaveStatus === 'saving' ? 'outline' : 'destructive'
            }>
              {autoSaveStatus === 'saved' ? 'Saved' : 
               autoSaveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExit} disabled={saving}>
              <LogOut className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <button
                key={s.id + '-' + i}
                onClick={() => setCurrentStep(i)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "text-chart-4"
                    : "text-muted-foreground"
                }`}
              >
                {i < currentStep && <Check className="h-3 w-3 inline mr-1" />}
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{step.title}</CardTitle>
            <CardDescription className="text-base whitespace-pre-wrap">
              {step.instruction}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.optional && (
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  )}
                  {currentModelId && (
                    <FieldAssistant
                      modelId={currentModelId}
                      stepTitle={step.title}
                      stepInstruction={step.instruction}
                      fieldLabel={field.label}
                      currentValue={formData[field.id]}
                      allProgress={formData}
                    />
                  )}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleReview}>
              Review & Submit
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </ProgramLayout>
  );
}
