import { chain } from "lodash";

export function formatCohortUsersString(val: string) {
  return (
    chain(val)
      // Split on space and comma delimiters, but ignore them inside single/double quotes. Breakdown:
      // [\s,]+ matches >= 1 whitespace/comma characters
      // (?=...) is a positive lookahead, "match the previous pattern only if it's followed by ..."
      // (?:...) is a non-capturing group that groups the pattern inside it without capturing it
      // [^'"] matches any non-quote character
      // '[^']*' and "[^"]*" match single and double quoted strings, respectively
      // *$ asserts that the lookahead pattern occurs >= 0 times until the end of the string
      .split(/[\s,]+(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/)
      .compact()
      .uniq()
      .map((val) => {
        // handle users entering full email addresses just in case
        return val.split("@")[0].trim();
      })
      .value()
      .join(",")
  );
}
