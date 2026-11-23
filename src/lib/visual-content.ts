import { guideSlug } from "./public-paths";
export type ContentBinding = {
  scope: "site" | "page" | "article" | "partner";
  key?: string;
  path: string[];
};
export type ContentPatch = {
  binding: ContentBinding;
  expected?: unknown;
  value?: unknown;
};
export type EditKind = "text" | "html" | "image" | "link" | "money";
export function cms(
  binding: ContentBinding,
  kind: EditKind = "text",
  value?: string,
) {
  return {
    "data-cms": JSON.stringify(binding),
    "data-cms-kind": kind,
    ...(value !== undefined ? { "data-cms-value": value } : {}),
  };
}
export const siteEdit = (
  path: string,
  kind: EditKind = "text",
  value?: string,
) => cms({ scope: "site", path: path.split(".") }, kind, value);
export const pageEdit = (
  key: string,
  path: string,
  kind: EditKind = "text",
  value?: string,
) => cms({ scope: "page", key, path: path.split(".") }, kind, value);
export const articleEdit = (
  guide: { id?: string; title: string; slug?: string },
  path: string,
  kind: EditKind = "text",
) =>
  cms(
    {
      scope: "article",
      key: guide.id || `guide:${guideSlug(guide)}`,
      path: path.split("."),
    },
    kind,
  );
export const bindingId = (binding: ContentBinding) => JSON.stringify(binding);
export function readContentPath(value: unknown, path: string[]): unknown {
  let cursor = value;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object" || !Object.hasOwn(cursor, key))
      return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}
export function writeContentPath(value: object, path: string[], next: unknown) {
  let cursor = value as Record<string, unknown>;
  for (const [i, key] of path.entries()) {
    if (["__proto__", "constructor", "prototype"].includes(key))
      throw Error("Campo non valido");
    if (i === path.length - 1) {
      if (next === undefined) delete cursor[key];
      else cursor[key] = next;
      return;
    }
    if (!cursor[key] || typeof cursor[key] !== "object")
      cursor[key] = /^\d+$/.test(path[i + 1]) ? [] : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
}

export const partnerEdit = (
  key: string,
  path: string,
  kind: EditKind = "text",
  value?: string,
) => cms({ scope: "partner", key, path: path.split(".") }, kind, value);
