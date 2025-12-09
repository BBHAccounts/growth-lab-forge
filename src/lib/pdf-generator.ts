import jsPDF from "jspdf";

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

interface PDFGeneratorOptions {
  modelName: string;
  emoji: string;
  steps: ModelStep[];
  formData: Record<string, unknown>;
}

export function generateModelPDF({ modelName, emoji, steps, formData }: PDFGeneratorOptions): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkNewPage = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Growth Lab branding header - top left
  pdf.setFillColor(40, 44, 52); // Dark background
  pdf.rect(0, 0, pageWidth, 25, "F");
  
  // Growth Lab logo text - left aligned
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 211, 0); // Yellow color
  pdf.text("GROWTH LAB", margin, 12);
  
  // "by Beyond Billable Hours" tagline - below logo
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 180);
  pdf.text("by Beyond Billable Hours", margin, 19);
  
  pdf.setTextColor(0);
  y = 40;

  // Model Title - left aligned with proper wrapping
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 44, 52);
  const title = `${emoji} ${modelName}`;
  const titleLines = pdf.splitTextToSize(title, contentWidth);
  titleLines.forEach((line: string) => {
    pdf.text(line, margin, y);
    y += 7;
  });
  y += 2;
  pdf.setTextColor(0);

  // Subtitle
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100);
  pdf.text("Strategy Workbook Summary", pageWidth / 2, y, { align: "center" });
  y += 6;

  // Date
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
  pdf.setTextColor(0);
  y += 15;

  // Steps
  steps.forEach((step, stepIndex) => {
    checkNewPage(30);

    // Step header
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y - 5, contentWidth, 10, "F");
    pdf.text(`Step ${stepIndex + 1}: ${step.title}`, margin + 3, y + 2);
    y += 15;

    // Fields
    step.fields.forEach((field) => {
      checkNewPage(20);
      
      // Field label
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60);
      pdf.text(field.label, margin, y);
      pdf.setTextColor(0);
      y += 6;

      const value = formData[field.id];
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      if (!value || (Array.isArray(value) && value.length === 0)) {
        pdf.setTextColor(150);
        pdf.text("Not filled in yet", margin + 5, y);
        pdf.setTextColor(0);
        y += 8;
      } else if (field.type === "list") {
        const listItems = (value as string[]).filter((item) => item.trim());
        listItems.forEach((item) => {
          checkNewPage(8);
          const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 10);
          pdf.text(lines, margin + 5, y);
          y += lines.length * 5 + 2;
        });
        if (listItems.length === 0) {
          pdf.setTextColor(150);
          pdf.text("Not filled in yet", margin + 5, y);
          pdf.setTextColor(0);
          y += 8;
        }
      } else if (field.type === "table") {
        const tableRows = value as Record<string, string>[];
        const columns = field.columns || [];
        
        if (tableRows.length > 0 && columns.length > 0) {
          const colWidth = (contentWidth - 10) / columns.length;
          
          // Table header
          checkNewPage(15);
          pdf.setFillColor(230, 230, 230);
          pdf.rect(margin + 5, y - 4, contentWidth - 10, 8, "F");
          pdf.setFont("helvetica", "bold");
          columns.forEach((col, colIndex) => {
            const x = margin + 5 + colIndex * colWidth;
            const text = pdf.splitTextToSize(col.label, colWidth - 4)[0];
            pdf.text(text, x + 2, y);
          });
          y += 8;

          // Table rows
          pdf.setFont("helvetica", "normal");
          tableRows.forEach((row) => {
            checkNewPage(12);
            let maxLines = 1;
            columns.forEach((col, colIndex) => {
              const x = margin + 5 + colIndex * colWidth;
              const cellText = row[col.id] || "-";
              const lines = pdf.splitTextToSize(cellText, colWidth - 4);
              maxLines = Math.max(maxLines, lines.length);
              pdf.text(lines, x + 2, y);
            });
            y += maxLines * 5 + 4;
          });
        } else {
          pdf.setTextColor(150);
          pdf.text("No entries yet", margin + 5, y);
          pdf.setTextColor(0);
          y += 8;
        }
      } else {
        // Text or textarea
        const text = String(value);
        const lines = pdf.splitTextToSize(text, contentWidth - 10);
        lines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, margin + 5, y);
          y += 5;
        });
        y += 3;
      }

      y += 5;
    });

    y += 10;
  });

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text("Generated by Growth Lab", pageWidth / 2, pageHeight - 10, { align: "center" });

  // Save
  const fileName = `${modelName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}
