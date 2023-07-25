export function parseSearchQueries(value: string): string[] {
  const queries = value
    .split(/[\s,]+/) // split on whitespaces and commas
    .filter(Boolean) // remove empty strings (e.g. when `value` is `123,,456`)
    .map((query) => {
      query = query.trim();
      // Add back leading 0s to queries that were copied from Excel, where leading 0s
      // of number cells are removed by default (e.g. `01234` becomes `1234`).
      const isNumber = /^\d*$/.test(query);
      if (isNumber) {
        return query.padStart(5, "0");
      }
      return query;
    });
  const uniqueQueries = Array.from(new Set(queries));
  return uniqueQueries;
}
