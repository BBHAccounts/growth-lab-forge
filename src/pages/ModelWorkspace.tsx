import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Save, X, Plus, Trash2, FileText, Download, PenLine } from "lucide-react";
import { ModelSummary } from "@/components/ModelSummary";
import { generateModelPDF } from "@/lib/pdf-generator";
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
}

interface Model {
  id: string;
  name: string;
  emoji: string | null;
  steps: ModelStep[];
}

interface ActivatedModel {
  id: string;
  progress: Record<string, unknown>;
  current_step: number;
  completed: boolean;
}

export default function ModelWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [model, setModel] = useState<Model | null>(null);
  const [activatedModel, setActivatedModel] = useState<ActivatedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState("work");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch model
      const { data: modelData, error: modelError } = await supabase
        .from("models")
        .select("id, name, emoji, steps")
        .eq("id", id)
        .single();

      if (modelError || !modelData) {
        toast({ title: "Model not found", variant: "destructive" });
        navigate("/models");
        return;
      }

      const parsedModel = {
        ...modelData,
        steps: Array.isArray(modelData.steps) ? (modelData.steps as unknown as ModelStep[]) : [],
      };
      setModel(parsedModel);

      // Fetch activated model
      const { data: activated } = await supabase
        .from("activated_models")
        .select("*")
        .eq("user_id", user.id)
        .eq("model_id", id)
        .single();

      if (!activated) {
        // Not activated, redirect to detail page
        navigate(`/models/${id}`);
        return;
      }

      const parsedActivated: ActivatedModel = {
        id: activated.id,
        progress: (activated.progress as Record<string, unknown>) || {},
        current_step: activated.current_step || 0,
        completed: activated.completed || false,
      };
      setActivatedModel(parsedActivated);
      setCurrentStep(parsedActivated.current_step);
      setFormData(parsedActivated.progress);
      setLoading(false);
    };

    fetchData();
  }, [id, navigate, toast]);

  const saveProgress = async (newStep?: number) => {
    if (!activatedModel) return;
    setSaving(true);

    const updates: Record<string, unknown> = {
      progress: formData,
      current_step: newStep ?? currentStep,
    };

    if (model && newStep === model.steps.length) {
      updates.completed = true;
    }

    const { error } = await supabase
      .from("activated_models")
      .update(updates)
      .eq("id", activatedModel.id);

    if (error) {
      toast({ title: "Error saving progress", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Progress saved" });
    }

    setSaving(false);
  };

  const handleNext = async () => {
    if (!model) return;
    const nextStep = Math.min(currentStep + 1, model.steps.length - 1);
    await saveProgress(nextStep);
    setCurrentStep(nextStep);
  };

  const handlePrev = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleComplete = async () => {
    if (!model) return;
    await saveProgress(model.steps.length);
    toast({ title: "Model completed!", description: "Congratulations on finishing this model." });
    navigate(`/models/${model.id}`);
  };

  const handleDeactivate = async () => {
    if (!activatedModel) return;
    
    const { error } = await supabase
      .from("activated_models")
      .delete()
      .eq("id", activatedModel.id);

    if (error) {
      toast({ title: "Error deactivating model", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Model deactivated" });
      navigate(`/models/${id}`);
    }
  };

  const handleDownloadPDF = () => {
    if (!model) return;
    generateModelPDF({
      modelName: model.name,
      emoji: model.emoji || "📚",
      steps: model.steps,
      formData,
    });
    toast({ title: "PDF Downloaded", description: "Your model summary has been downloaded." });
  };

  const updateFieldValue = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeListItem(field.id, i)}
                  className="shrink-0"
                >
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
                  <Label key={col.id} className="text-xs text-muted-foreground">
                    {col.label}
                  </Label>
                ))}
                <div />
              </div>
            )}
            {tableRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 40px` }}
              >
                {columns.map((col) => (
                  <Input
                    key={col.id}
                    value={row[col.id] || ""}
                    onChange={(e) => updateTableCell(field.id, rowIndex, col.id, e.target.value)}
                    placeholder={col.label}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTableRow(field.id, rowIndex)}
                >
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

  if (loading || !model) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8">
          <div className="h-12 bg-muted rounded w-1/3 mb-8" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </AppLayout>
    );
  }

  const step = model.steps[currentStep];
  const progress = ((currentStep + 1) / model.steps.length) * 100;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/models/${model.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>{model.emoji}</span>
                {model.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {model.steps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => saveProgress()} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" title="Deactivate model">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate Model?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all your progress on this model. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate}>
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs for Work and Summary */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="work" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Work on Model
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="work" className="mt-6">
            {/* Progress */}
            <div className="mb-8">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-2">
                {model.steps.map((s, i) => (
                  <button
                    key={s.id}
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
                <CardDescription className="text-base">{step.instruction}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {field.label}
                      {field.optional && (
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      )}
                      <FieldAssistant
                        modelId={model.id}
                        stepTitle={step.title}
                        stepInstruction={step.instruction}
                        fieldLabel={field.label}
                        currentValue={formData[field.id]}
                        allProgress={formData}
                      />
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
              {currentStep === model.steps.length - 1 ? (
                <Button onClick={handleComplete}>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Model
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            {/* PDF Download Button */}
            <div className="flex justify-end mb-6">
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Summary View */}
            <ModelSummary
              modelName={model.name}
              emoji={model.emoji || "📚"}
              steps={model.steps}
              formData={formData}
              currentStep={currentStep}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
