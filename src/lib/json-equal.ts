/** Compare persisted JSON by value: PostgreSQL JSONB does not preserve object key order. */
export function jsonEqual(left: unknown, right: unknown) {
  const canonical = (value: unknown) =>
    JSON.stringify(value, (_key, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, item[key]]),
          )
        : item,
    );
  return canonical(left) === canonical(right);
}
