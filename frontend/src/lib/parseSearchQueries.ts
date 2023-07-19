export function parseSearchQueries(value: string): string[] {
  const queries = value
    .split(/[\s,]+/) // split on whitespaces and commas
    .map((query) => {
      query = query.trim();
      // Handle cases where users bulk search by copying and pasting from a spreadsheet,
      // and leading zeros are stripped from a IGO Request ID (e.g. `01234` becomes `1234`)
      if (query && query.length < 5) {
        query = query.padStart(5, "0");
      }
      return query;
    })
    .filter(Boolean); // remove empty strings (e.g. when `value` is `123,,456`)
  const uniqueQueries = Array.from(new Set(queries));
  return uniqueQueries;
}
