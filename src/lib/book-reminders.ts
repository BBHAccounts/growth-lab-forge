import { PUBLIC_APP_URL } from "@/config/public-app";
import type { BookReminderEmail } from "@/content/bookReminderEmails";

export function reminderVideoLink(id: string, code: string): string {
  const url = new URL(`/book/v/${encodeURIComponent(id)}`, PUBLIC_APP_URL);
  url.searchParams.set("code", code);
  return url.toString();
}

export function reminderSenderKey(programmeId: string): string {
  return `book-reminder-sender:${programmeId}`;
}

export function reminderParagraphs(email: BookReminderEmail, sender: string, code: string): string[] {
  return ["Hi everyone,", ...email.intro, `Watch the video: ${email.title} (${reminderVideoLink(email.id, code)})`, `Put it into practice: ${email.practice}`, ...email.closing, "Best wishes,", sender];
}

const escapeHTML = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function reminderClipboard(email: BookReminderEmail, sender: string, code: string) {
  const paragraph = (text: string) => `<p style="margin:0 0 12px 0;">${escapeHTML(text)}</p>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${paragraph("Hi everyone,")}${email.intro.map(paragraph).join("")}<p style="margin:0 0 12px 0;">Watch the video: <a href="${escapeHTML(reminderVideoLink(email.id, code))}">${escapeHTML(email.title)}</a></p>${paragraph(`Put it into practice: ${email.practice}`)}${email.closing.map(paragraph).join("")}<p style="margin:0;">Best wishes,<br>${escapeHTML(sender).replace(/\r?\n/g, "<br>")}</p></div>`;
  return { html, text: reminderParagraphs(email, sender, code).join("\n\n") };
}

export function reminderJoinTarget(stepId: string, code: string | null): string {
  const params = new URLSearchParams({ returnTo: `/book/v/${stepId}` });
  if (code) params.set("code", code);
  return `/book/join?${params.toString()}`;
}