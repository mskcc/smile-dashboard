export function parseSearchQueries(value: string): string[] {
  const queries = value
    .split(/[\s,]+/)
    .map((query) => query.trim())
    .filter(Boolean); // remove empty strings
  const uniqueQueries = Array.from(new Set(queries));
  return uniqueQueries;
}
