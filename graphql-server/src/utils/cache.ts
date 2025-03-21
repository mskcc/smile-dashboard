import fetch from "node-fetch";
import NodeCache from "node-cache";
import { props } from "./constants";
import { neo4jDriver } from "./servers";
import {
  buildSamplesQueryBody,
  buildSamplesQueryFull,
  queryDashboardSamples,
} from "../schemas/queries/samples";
import { DashboardRecordSort, DashboardSample } from "../generated/graphql";

export const ONCOTREE_CACHE_KEY = "oncotree";
export const SAMPLES_CACHE_KEY = "samples";

const ONCOTREE_CACHE_TTL_SECONDS = 86400; // 1 day
const SAMPLES_CACHE_TTL_SECONDS = 3600; // 1 hour

const SAMPLES_PAGES_TO_CACHE = 3; // lower this during dev for faster iterations
const CACHE_BLOCK_SIZE = 100; // keep consistent with helpers.tsx's CACHE_BLOCK_SIZE
const SAMPLES_DEFAULT_SORT = {
  // keep consistent with SamplesList.tsx's DEFAULT_SORT
  colId: "importDate",
  sort: "desc",
} as DashboardRecordSort;
const WES_SAMPLE_CONTEXT = {
  // keep consistent with SamplesPage.tsx's WES_SAMPLE_CONTEXT
  fieldName: "genePanel",
  values: [
    "Agilent_51MB",
    "Agilent_v4_51MB_Human",
    "CustomCapture",
    "IDT_Exome_v1_FP",
    "IDT_Exome_V1_IMPACT468",
    "WES_Human",
    "WholeExomeSequencing",
  ],
};

export type OncotreeCache = Record<string, { name: string; mainType: string }>; // key = Oncotree code
export type SamplesCache = Record<string, DashboardSample[]>; // key = full Cypher query

/**
 * Source: https://oncotree.mskcc.org/#/home?tab=api
 */
export type OncotreeApiTumorType = {
  children: Record<string, unknown>;
  code: string;
  color: string;
  externalReferences: Record<string, unknown>;
  history: string[];
  level: number;
  mainType: string;
  name: string;
  parent: string;
  precursors: string[];
  revocations: string[];
  tissue: string;
};

export async function initializeInMemoryCache() {
  const inMemoryCache = new NodeCache();
  await updateOncotreeCache(inMemoryCache);
  await updateSamplesCache(inMemoryCache);
  // Functions to run when items in cache expire
  // (node-cache checks for expired items and runs this event listener every 10m by default)
  inMemoryCache.on("expired", (key) => {
    if (key === ONCOTREE_CACHE_KEY) {
      console.info("Refreshing the Oncotree cache...");
      updateOncotreeCache(inMemoryCache);
    }
    if (key === SAMPLES_CACHE_KEY) {
      console.info("Refreshing the samples cache...");
      updateSamplesCache(inMemoryCache);
    }
  });
  return inMemoryCache;
}

export async function updateOncotreeCache(inMemoryCache: NodeCache) {
  console.info("Saving select data from the latest Oncotree API to cache...");
  const oncotreeApiData = await fetchOncotreeApiData();
  if (!oncotreeApiData) return;
  const oncotreeCache = oncotreeApiData.reduce((acc, tumor) => {
    acc[tumor.code] = { name: tumor.name, mainType: tumor.mainType };
    return acc;
  }, {} as OncotreeCache);
  // Add to cache oncotree codes found in Neo4j but not in Oncotree API's response
  // (These codes are likely old codes that have been renamed in the Oncotree database)
  const oncotreeCodesInNeo4j = await getOncotreeCodesFromNeo4j();
  oncotreeCodesInNeo4j?.forEach((code) => {
    if (!oncotreeCache.hasOwnProperty(code)) {
      oncotreeCache[code] = { name: "N/A", mainType: "N/A" };
    }
  });
  inMemoryCache.set(
    ONCOTREE_CACHE_KEY,
    oncotreeCache,
    ONCOTREE_CACHE_TTL_SECONDS
  ); // 1 day
}

async function fetchOncotreeApiData() {
  try {
    const response = await fetch(props.oncotree_api, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch the Oncotree API: ${response.statusText}`
      );
    }
    return (await response.json()) as Promise<OncotreeApiTumorType[]>;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error occurred while fetching Oncotree data");
    }
    return null;
  }
}

async function getOncotreeCodesFromNeo4j() {
  const session = neo4jDriver.session();
  try {
    const result = await session.writeTransaction((tx) =>
      tx.run(`
        MATCH (sm:SampleMetadata) RETURN DISTINCT sm.oncotreeCode AS oncotreeCode
      `)
    );
    return result.records
      .map((record) => record.get("oncotreeCode"))
      .filter(Boolean) as string[];
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await session.close();
  }
}

// TODO: run these queries concurrently using Promise.all to reduce startup time
async function updateSamplesCache(inMemoryCache: NodeCache) {
  const oncotreeCache = inMemoryCache.get(ONCOTREE_CACHE_KEY) as OncotreeCache;

  // fetch and save results of the all-samples query
  const allSamplesQueryBody = buildSamplesQueryBody({
    searchVals: [],
    context: undefined,
    filters: undefined,
    addlOncotreeCodes: [],
  });
  const allSamplesCacheContent = await buildSamplesCacheContent({
    queryNameForLogging: "all samples",
    queryBody: allSamplesQueryBody,
    oncotreeCache,
  });

  // fetch and save results of the WES samples query
  const wesSamplesQueryBody = buildSamplesQueryBody({
    searchVals: [],
    context: WES_SAMPLE_CONTEXT,
    filters: undefined,
    addlOncotreeCodes: [],
  });
  const wesSamplesCacheContent = await buildSamplesCacheContent({
    queryNameForLogging: "WES samples",
    queryBody: wesSamplesQueryBody,
    oncotreeCache,
  });

  // Add all query results to cache
  inMemoryCache.set(
    SAMPLES_CACHE_KEY,
    {
      ...allSamplesCacheContent,
      ...wesSamplesCacheContent,
    },
    SAMPLES_CACHE_TTL_SECONDS
  );
}

async function buildSamplesCacheContent({
  queryNameForLogging,
  queryBody,
  oncotreeCache,
}: {
  queryNameForLogging: string;
  queryBody: string;
  oncotreeCache: OncotreeCache;
}) {
  const samplesCacheContent = {} as SamplesCache;

  // Save the first few "pages" of that query's result to cache
  for (let i = 0; i < SAMPLES_PAGES_TO_CACHE; i++) {
    const samplesCypherQuery = await buildSamplesQueryFull({
      queryBody,
      sort: SAMPLES_DEFAULT_SORT,
      limit: CACHE_BLOCK_SIZE,
      offset: i * CACHE_BLOCK_SIZE,
    });
    console.info(
      "Caching page " + (i + 1) + " of " + queryNameForLogging + " query..."
    );
    const queryResult = await queryDashboardSamples({
      samplesCypherQuery,
      oncotreeCache,
    });
    if (queryResult) {
      samplesCacheContent[samplesCypherQuery] = queryResult;
    }
  }

  return samplesCacheContent;
}
