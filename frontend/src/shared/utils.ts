import { Sample } from "../generated/graphql";

export function getAllSamples(data: any) {
  return data.samplesConnection.edges.map((e: any) => e.node) as Sample[];
}

export function getCohortSamples(data: any) {
  return data!.cohorts.flatMap((c: any) =>
    c.hasSample2Samples.map((s: any) => s)
  ) as Sample[];
}
