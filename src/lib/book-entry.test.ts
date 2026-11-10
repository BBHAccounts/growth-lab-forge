/// <reference types="bun" />
import { describe, test, expect } from "bun:test";
import { bookDestination, bookMagicLinkReturn, clearBookEntry, isBookEntry, needsBookOnboarding, rememberBookEntry, rememberBookVideo, safeBookVideoReturn } from "./book-entry";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe("book joining", () => {
  test("firm reminder video survives joining and travels in the magic link for another device", () => {
    const store = storage(); rememberBookVideo(store, "/book/v/3B"); rememberBookEntry(store, "BBHTEST");
    expect(bookDestination(store)).toBe("/book/v/3B");
    expect(new URL(bookMagicLinkReturn("https://growthlab.beyondbillablehours.io", "BBHTEST", bookDestination(store))).searchParams.get("returnTo")).toBe("/book/v/3B");
    clearBookEntry(store); expect(bookDestination(store)).toBe("/book");
  });
  test("return destinations cannot redirect outside book videos or outside the app", () => {
    for (const path of ["https://other.example", "//other.example", "/admin", "/book/v/../join", "/book/v/3B?next=outside"]) expect(safeBookVideoReturn(path)).toBeNull();
  });
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