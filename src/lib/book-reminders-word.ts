import { Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel } from "docx";
import { bookReminderEmails } from "@/content/bookReminderEmails";
import { reminderVideoLink } from "./book-reminders";

export async function reminderWordBlob(sender: string, code: string): Promise<Blob> {
  const paragraph = (text: string) => new Paragraph({ spacing: { after: 180 }, children: [new TextRun(text)] });
  const doc = new Document({
    creator: "Beyond the Book",
    title: "Beyond the Book reminder emails",
    styles: {
      default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 180 } } } },
      paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 28, bold: true }, paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 } }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children: bookReminderEmails.flatMap((email, index) => [
        new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: index > 0, children: [new TextRun(`${email.id} · ${email.subject}`)] }),
        paragraph("Hi everyone,"),
        ...email.intro.map(paragraph),
        new Paragraph({ children: [new TextRun("Watch the video: "), new ExternalHyperlink({ link: reminderVideoLink(email.id, code), children: [new TextRun({ text: email.title, style: "Hyperlink" })] })] }),
        paragraph(`Put it into practice: ${email.practice}`),
        ...email.closing.map(paragraph),
        new Paragraph({ spacing: { after: 0 }, children: [new TextRun("Best wishes,")] }),
        paragraph(sender),
      ]),
    }],
  });
  return Packer.toBlob(doc);
}