import { expect, test } from "bun:test";
import { bookReminderEmails } from "../content/bookReminderEmails";
import { reminderClipboard, reminderJoinTarget, reminderSenderKey, reminderVideoLink } from "./book-reminders";

test("all 45 reminders are in chapter and video order", () => {
  expect(bookReminderEmails.map(email => email.id)).toEqual(Array.from({ length: 15 }, (_, i) => ["A", "B", "C"].map(section => `${i + 1}${section}`)).flat());
});
test("reminder links always target the live app with the programme code", () => {
  expect(reminderVideoLink("1A", "BBHTEST")).toBe("https://growthlab.beyondbillablehours.io/book/v/1A?code=BBHTEST");
  expect(new URL(reminderVideoLink("15C", "A&B")).searchParams.get("code")).toBe("A&B");
});
test("reminder sender drafts are isolated per programme", () => {
  expect(reminderSenderKey("one")).not.toBe(reminderSenderKey("two"));
});
test("clipboard fallback includes the same working video destination", () => {
  const email = bookReminderEmails[0];
  if (!email) throw new Error("Missing first reminder");
  const result = reminderClipboard(email, "Learning & Development", "BBHTEST");
  expect(result.text).toContain(reminderVideoLink("1A", "BBHTEST"));
  expect(result.html).toContain(`href="${reminderVideoLink("1A", "BBHTEST")}"`);
  expect(result.html).toContain("Learning &amp; Development");
});
test("reminder joining retains both programme code and video destination", () => {
  const target = new URL(reminderJoinTarget("3B", "BBHTEST"), "https://example.test");
  expect(target.pathname).toBe("/book/join");
  expect(target.searchParams.get("code")).toBe("BBHTEST");
  expect(target.searchParams.get("returnTo")).toBe("/book/v/3B");
});