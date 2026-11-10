import { addDays, format } from "date-fns";
import { PUBLIC_APP_URL } from "@/config/public-app";

export const BOOK_JOIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookJoinCode(random: (array: Uint8Array) => Uint8Array = array => crypto.getRandomValues(array)): string {
  let code = "";
  // Rejection sampling avoids bias and excludes ambiguous letters and digits.
  const limit = 256 - (256 % BOOK_JOIN_ALPHABET.length);
  while (code.length < 8) {
    for (const value of random(new Uint8Array(16))) {
      if (value < limit) code += BOOK_JOIN_ALPHABET[value % BOOK_JOIN_ALPHABET.length];
      if (code.length === 8) break;
    }
  }
  return code;
}

export function bookJoinLink(code: string): string {
  const url = new URL("/book/join", PUBLIC_APP_URL);
  url.searchParams.set("code", code.trim().toUpperCase());
  return url.toString();
}

export function weeklyBookDates<T extends { order_index: number; deadline: string | null }>(models: readonly T[], start: Date): T[] {
  return models.map((model, index) => ({ ...model, order_index: index + 1, deadline: format(addDays(start, index * 7), "yyyy-MM-dd") }));
}

export interface BookParticipantProgress {
  participant_id: string;
  name: string | null;
  email: string | null;
  joined_at: string;
  last_active: string | null;
  steps_done: number;
  current_chapter: number | null;
}

export function bookProgressCSV(rows: readonly BookParticipantProgress[]): string {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [["Name", "Email", "Joined", "Last active", "Steps done", "Current chapter"], ...rows.map(row => [row.name, row.email, row.joined_at, row.last_active, row.steps_done, row.current_chapter])].map(row => row.map(cell).join(",")).join("\r\n");
}