export const BOOK_CODE_KEY = "gl-book-join-code";
export const BOOK_RETURN_KEY = "gl-book-return";
export const BOOK_VIDEO_KEY = "gl-book-video-return";

export function safeBookVideoReturn(path: string | null): string | null {
  return path && /^\/book\/v\/[A-Za-z0-9_-]+$/.test(path) ? path : null;
}

export function rememberBookVideo(storage: Pick<Storage, "setItem">, path: string) {
  const safe = safeBookVideoReturn(path);
  if (safe) storage.setItem(BOOK_VIDEO_KEY, safe);
}

export function bookDestination(storage: Pick<Storage, "getItem">): string {
  return safeBookVideoReturn(storage.getItem(BOOK_VIDEO_KEY)) ?? "/book";
}

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
  storage.removeItem(BOOK_VIDEO_KEY);
}

export function bookMagicLinkReturn(origin: string, code: string, returnTo?: string): string {
  const url = new URL("/book/join", origin);
  if (code) url.searchParams.set("code", code);
  const safe = safeBookVideoReturn(returnTo ?? null);
  if (safe) url.searchParams.set("returnTo", safe);
  return url.toString();
}

export function needsBookOnboarding(profile: { full_name: string | null; firm_name: string | null } | null): boolean {
  return !profile?.full_name?.trim() || !profile.firm_name?.trim();
}