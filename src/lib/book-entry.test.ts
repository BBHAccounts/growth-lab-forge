/// <reference types="bun" />
import { describe, test, expect } from "bun:test";
import { bookMagicLinkReturn, clearBookEntry, isBookEntry, needsBookOnboarding, rememberBookEntry } from "./book-entry";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe("book joining", () => {
  test("code is retained through sign-in and onboarding without query parameters", () => {
    const store = storage();
    expect(rememberBookEntry(store, "BBHTEST")).toBe("BBHTEST");
    expect(rememberBookEntry(store, null)).toBe("BBHTEST");
    expect(isBookEntry(store)).toBe(true);
  });
  test("a new firm's link overrides the stored code", () => {
    const store = storage(); rememberBookEntry(store, "OLD");
    expect(rememberBookEntry(store, "NEW")).toBe("NEW");
  });
  test("magic links return to book join on the same origin, retaining the code for another device", () => {
    expect(bookMagicLinkReturn("https://growthlab.beyondbillablehours.io", "BBHTEST")).toBe("https://growthlab.beyondbillablehours.io/book/join?code=BBHTEST");
    expect(bookMagicLinkReturn("https://growthlab.beyondbillablehours.io", "")).toBe("https://growthlab.beyondbillablehours.io/book/join");
  });
  test("book onboarding requires only a name and law firm", () => {
    expect(needsBookOnboarding(null)).toBe(true);
    expect(needsBookOnboarding({ full_name: "Stijn", firm_name: "" })).toBe(true);
    expect(needsBookOnboarding({ full_name: "", firm_name: "BBH" })).toBe(true);
    expect(needsBookOnboarding({ full_name: "Stijn", firm_name: "BBH" })).toBe(false);
  });
  test("joining clears the pending book intent so normal Growth Lab onboarding stays normal", () => {
    const store = storage(); rememberBookEntry(store, "BBHTEST"); clearBookEntry(store);
    expect(isBookEntry(store)).toBe(false);
    expect(rememberBookEntry(store, null)).toBe("");
  });
});