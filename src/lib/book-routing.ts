export function bookRootDestination(member: boolean, admin: boolean): string {
  return member || admin ? "/book" : "/book/join";
}

export function shouldLeaveBookJoin(participant: boolean, programmeMatches: boolean): boolean {
  return participant && programmeMatches;
}

export function safeAppReturn(path: string | null): string {
  if (!path || path.startsWith("//") || /[\\#]/.test(path)) return "/book";
  return /^\/(?:book(?:\/(?:chapters|chapter\/(?:[1-9]|1[0-5])|notes|library(?:\/[A-Za-z0-9_-]+(?:\/workspace)?)?|tools(?:\/[A-Za-z0-9_-]+)?|v\/[A-Za-z0-9_-]+))?|models(?:\/[A-Za-z0-9_-]+(?:\/workspace)?)?|account|admin(?:\/(?:users|models|programs|settings)(?:\/[A-Za-z0-9_-]+)?(?:\/responses)?)?)(?:\?[^#]*)?$/.test(path) ? path : "/book";
}

export function isBookTool(tags: string[] | null | undefined): boolean {
  return Boolean(tags?.some(tag => /^book-ch(?:[1-9]|1[0-5])$/.test(tag)));
}