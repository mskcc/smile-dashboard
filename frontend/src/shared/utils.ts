import { Sample } from "../generated/graphql";

export function getAllSamplesFromQueryData(data: any) {
  return data.samplesConnection.edges.map((e: any) => e.node) as Sample[];
}

export function getCohortSamplesFromQueryData(data: any) {
  return data!.cohorts.flatMap((c: any) =>
    c.hasSample2Samples.map((s: any) => s)
  ) as Sample[];
}

export function getMetadataFromSamples(samples: Sample[]) {
  return samples.map((s: any) => {
    return {
      ...s.hasMetadataSampleMetadata[0],
      revisable: s.revisable,
    };
  });
}

export function getCohortDataFromSamples(samples: Sample[]) {
  console.log(samples);
  return samples.map((s: any) => {
    return {
      ...s.hasMetadataSampleMetadata[0],
      revisable: s.revisable,
      bamComplete: s.hasTempoTempos[0].hasEventBamCompletes[0],
      mafComplete: s.hasTempoTempos[0].hasEventMafCompletes[0],
      qcComplete: s.hasTempoTempos[0].hasEventQcCompletes[0],
    };
  });
}
