export const BOOK_CODE_KEY = "gl-book-join-code";
export const BOOK_RETURN_KEY = "gl-book-return";

export function rememberBookEntry(storage: Pick<Storage, "getItem" | "setItem">, code: string | null): string {
  storage.setItem(BOOK_RETURN_KEY, "/book/join");
  if (code !== null) storage.setItem(BOOK_CODE_KEY, code);
  return code ?? storage.getItem(BOOK_CODE_KEY) ?? "";
}

export function isBookEntry(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(BOOK_RETURN_KEY) === "/book/join";
}

export function clearBookEntry(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(BOOK_CODE_KEY);
  storage.removeItem(BOOK_RETURN_KEY);
}

export function bookMagicLinkReturn(origin: string, code: string): string {
  const url = new URL("/book/join", origin);
  if (code) url.searchParams.set("code", code);
  return url.toString();
}

export function needsBookOnboarding(profile: { full_name: string | null; firm_name: string | null } | null): boolean {
  return !profile?.full_name?.trim() || !profile.firm_name?.trim();
}