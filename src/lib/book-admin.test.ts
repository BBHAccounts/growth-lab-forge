/// <reference types="bun" />
import { expect, test } from "bun:test";
import { BOOK_JOIN_ALPHABET, bookJoinLink, bookProgressCSV, generateBookJoinCode, weeklyBookDates } from "./book-admin";

test("generated firm codes have eight uppercase unambiguous letters and digits", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateBookJoinCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  }
  expect(BOOK_JOIN_ALPHABET).not.toMatch(/[O0I1]/);
});
test("copy join link uses the Growth Lab published domain and firm code", () => {
  expect(bookJoinLink(" BBHTEST ")).toBe("https://growthlab.beyondbillablehours.io/book/join?code=BBHTEST");
});
test("fifteen chapter dates are seven calendar days apart with one-based chapter numbers", () => {
  const models = Array.from({ length: 15 }, (_, i) => ({ model_id: `chapter-${i + 1}`, order_index: i, deadline: null }));
  const dates = weeklyBookDates(models, new Date(2026, 10, 10));
  expect(dates).toHaveLength(15);
  expect(dates[0]).toMatchObject({ order_index: 1, deadline: "2026-11-10" });
  expect(dates[1]).toMatchObject({ order_index: 2, deadline: "2026-11-17" });
  expect(dates[14]).toMatchObject({ order_index: 15, deadline: "2027-02-16" });
  expect(models[0].deadline).toBeNull();
});
test("book CSV exports only progress, never extra response or note properties", () => {
  const row = { participant_id: "test", name: "Lawyer", email: "lawyer@example.test", joined_at: "2026-11-10", last_active: null, steps_done: 7, current_chapter: 3, responses: { notes_3B: "Secret note" } };
  const csv = bookProgressCSV([row]);
  expect(csv).toContain('"7","3"');
  expect(csv).not.toContain("Secret note");
  expect(csv).not.toContain("responses");
});
test("CSV protects spreadsheet formula cells and escapes quotes", () => {
  const csv = bookProgressCSV([{ participant_id: "test", name: '=HYPERLINK("url")', email: null, joined_at: "2026-11-10", last_active: null, steps_done: 0, current_chapter: 1 }]);
  expect(csv).toContain('"\'=HYPERLINK(""url"")"');
});