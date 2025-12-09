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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const labelColWidth = 60;
  const valueColWidth = contentWidth - labelColWidth;
  let y = margin;

  const checkNewPage = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawTableRow = (label: string, value: string, isHeader = false) => {
    const rowHeight = Math.max(
      pdf.splitTextToSize(label, labelColWidth - 6).length * 5,
      pdf.splitTextToSize(value || "-", valueColWidth - 6).length * 5,
      10
    ) + 4;

    checkNewPage(rowHeight);

    // Background
    if (isHeader) {
      pdf.setFillColor(45, 55, 72);
      pdf.setTextColor(255);
    } else {
      pdf.setFillColor(249, 250, 251);
      pdf.setTextColor(0);
    }
    
    pdf.rect(margin, y, contentWidth, rowHeight, "F");
    
    // Border
    pdf.setDrawColor(200);
    pdf.rect(margin, y, labelColWidth, rowHeight, "S");
    pdf.rect(margin + labelColWidth, y, valueColWidth, rowHeight, "S");

    // Text
    pdf.setFontSize(9);
    pdf.setFont("helvetica", isHeader ? "bold" : "normal");
    
    const labelLines = pdf.splitTextToSize(label, labelColWidth - 6);
    const valueLines = pdf.splitTextToSize(value || "-", valueColWidth - 6);
    
    pdf.text(labelLines, margin + 3, y + 6);
    
    if (!isHeader) pdf.setTextColor(60);
    pdf.text(valueLines, margin + labelColWidth + 3, y + 6);
    pdf.setTextColor(0);

    y += rowHeight;
  };

  // Title
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text(modelName, pageWidth / 2, y + 5, { align: "center" });
  y += 15;

  // Subtitle
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100);
  pdf.text("Strategy Workbook", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Date
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, y, { align: "center" });
  pdf.setTextColor(0);
  y += 15;

  // Process each step
  steps.forEach((step, stepIndex) => {
    checkNewPage(25);

    // Step header
    pdf.setFillColor(45, 55, 72);
    pdf.rect(margin, y, contentWidth, 12, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255);
    pdf.text(`Step ${stepIndex + 1}: ${step.title}`, margin + 5, y + 8);
    pdf.setTextColor(0);
    y += 14;

    // Fields as table rows
    step.fields.forEach((field) => {
      const value = formData[field.id];

      if (field.type === "list") {
        const listItems = (value as string[] | undefined)?.filter((item) => item?.trim()) || [];
        const listValue = listItems.length > 0 
          ? listItems.map((item, i) => `${i + 1}. ${item}`).join("\n")
          : "Not filled in";
        drawTableRow(field.label, listValue);
      } else if (field.type === "table") {
        const tableRows = (value as Record<string, string>[] | undefined) || [];
        const columns = field.columns || [];
        
        if (tableRows.length > 0 && columns.length > 0) {
          // Draw field label as header
          checkNewPage(15);
          pdf.setFillColor(100, 116, 139);
          pdf.rect(margin, y, contentWidth, 10, "F");
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255);
          pdf.text(field.label, margin + 3, y + 6);
          pdf.setTextColor(0);
          y += 12;

          // Column headers
          const colWidth = contentWidth / columns.length;
          checkNewPage(12);
          pdf.setFillColor(226, 232, 240);
          pdf.rect(margin, y, contentWidth, 10, "F");
          
          columns.forEach((col, colIndex) => {
            pdf.setDrawColor(200);
            pdf.rect(margin + colIndex * colWidth, y, colWidth, 10, "S");
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(60);
            const headerText = pdf.splitTextToSize(col.label, colWidth - 4)[0];
            pdf.text(headerText, margin + colIndex * colWidth + 3, y + 6);
          });
          pdf.setTextColor(0);
          y += 10;

          // Table data rows
          tableRows.forEach((row) => {
            const maxLines = columns.reduce((max, col) => {
              const cellText = row[col.id] || "-";
              return Math.max(max, pdf.splitTextToSize(cellText, colWidth - 4).length);
            }, 1);
            const rowHeight = maxLines * 5 + 4;
            
            checkNewPage(rowHeight);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin, y, contentWidth, rowHeight, "F");
            
            columns.forEach((col, colIndex) => {
              pdf.setDrawColor(200);
              pdf.rect(margin + colIndex * colWidth, y, colWidth, rowHeight, "S");
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "normal");
              const cellText = row[col.id] || "-";
              const lines = pdf.splitTextToSize(cellText, colWidth - 4);
              pdf.text(lines, margin + colIndex * colWidth + 3, y + 5);
            });
            y += rowHeight;
          });
          y += 4;
        } else {
          drawTableRow(field.label, "No entries");
        }
      } else {
        // Text or textarea
        const textValue = value ? String(value) : "Not filled in";
        drawTableRow(field.label, textValue);
      }
    });

    y += 8;
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    pdf.text("Growth Lab Strategy Workbook", margin, pageHeight - 8);
  }

  // Save
  const fileName = `${modelName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_workbook_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}
