import * as Apollo from "@apollo/client";
import { RequestsListDocument } from "../generated/graphql";

const defaultOptions = {} as const;

export function useHookLazyGeneric<T, V>(
  baseOptions?: Apollo.LazyQueryHookOptions<any, any>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<any, any>(RequestsListDocument, options);
}
