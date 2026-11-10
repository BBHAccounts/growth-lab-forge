export type LibraryModel = { status: string | null; tags: string[] | null };

export function isLibraryModel(model: LibraryModel): boolean {
  return model.status === "active" && !model.tags?.includes("beyond-the-book");
}

export function linkedChapters(tags: readonly string[] | null | undefined): number[] {
  return [...new Set((tags ?? []).filter(tag => /^book-ch(?:[1-9]|1[0-5])$/.test(tag)).map(tag => Number(tag.slice(7))))].sort((a, b) => a - b);
}

export function setLinkedChapters(tags: readonly string[], chapters: readonly number[]): string[] {
  return [...tags.filter(tag => !/^book-ch(?:[1-9]|1[0-5])$/.test(tag)), ...[...new Set(chapters)].filter(n => Number.isInteger(n) && n >= 1 && n <= 15).sort((a, b) => a - b).map(n => `book-ch${n}`)];
}