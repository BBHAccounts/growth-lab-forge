import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";

interface ModelField {
  id: string;
  type: string;
  label: string;
  columns?: Array<{ id: string; label: string }>;
}

interface ModelStep {
  id: string;
  title: string;
  instruction: string;
  fields: ModelField[];
}

interface ModelSummaryProps {
  modelName: string;
  emoji: string;
  steps: ModelStep[];
  formData: Record<string, unknown>;
  currentStep: number;
}

export function ModelSummary({ modelName, emoji, steps, formData, currentStep }: ModelSummaryProps) {
  const renderFieldValue = (field: ModelField) => {
    const value = formData[field.id];
    
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-muted-foreground italic">Not filled in yet</span>;
    }

    switch (field.type) {
      case "textarea":
      case "text":
        return <p className="whitespace-pre-line">{String(value)}</p>;

      case "list":
        const listItems = value as string[];
        return (
          <ul className="list-disc list-inside space-y-1">
            {listItems.filter(item => item.trim()).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );

      case "table":
        const tableRows = value as Record<string, string>[];
        const columns = field.columns || [];
        if (tableRows.length === 0) {
          return <span className="text-muted-foreground italic">No entries yet</span>;
        }
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  {columns.map((col) => (
                    <th key={col.id} className="border border-border px-3 py-2 text-left font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((col) => (
                      <td key={col.id} className="border border-border px-3 py-2">
                        {row[col.id] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p>{String(value)}</p>;
    }
  };

  const isStepComplete = (stepIndex: number, step: ModelStep) => {
    return step.fields.some(field => {
      const value = formData[field.id];
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0 && value.some(v => v && String(v).trim());
      return String(value).trim().length > 0;
    });
  };

  return (
    <div className="space-y-6" id="model-summary-content">
      <div className="text-center mb-8">
        <span className="text-4xl">{emoji}</span>
        <h1 className="text-2xl font-bold mt-2">{modelName}</h1>
        <p className="text-muted-foreground">Summary of your progress</p>
      </div>

      {steps.map((step, stepIndex) => {
        const hasContent = isStepComplete(stepIndex, step);
        
        return (
          <Card key={step.id} className={!hasContent ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {hasContent ? (
                    <CheckCircle className="h-5 w-5 text-chart-4" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  Step {stepIndex + 1}: {step.title}
                </CardTitle>
                {stepIndex <= currentStep && (
                  <Badge variant={hasContent ? "default" : "secondary"}>
                    {hasContent ? "Completed" : "In Progress"}
                  </Badge>
                )}
                {stepIndex > currentStep && (
                  <Badge variant="outline">Not Started</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <h4 className="font-medium text-sm text-muted-foreground">{field.label}</h4>
                  <div className="pl-0">{renderFieldValue(field)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
