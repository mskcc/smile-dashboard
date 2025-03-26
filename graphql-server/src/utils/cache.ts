import fetch from "node-fetch";
import NodeCache from "node-cache";
import { props } from "./constants";
import { neo4jDriver } from "./servers";
import {
  buildSamplesQueryBody,
  buildSamplesQueryFinal,
  queryDashboardSamples,
} from "../schemas/queries/samples";
import { DashboardRecordSort, DashboardSample } from "../generated/graphql";

export const ONCOTREE_CACHE_KEY = "oncotree";
export const SAMPLES_CACHE_KEY = "samples";

const ONCOTREE_CACHE_TTL = 86400; // 1 day
const SAMPLES_CACHE_TTL = 3600; // 1 hour

const SAMPLES_PAGES_TO_CACHE = 5; // lower this if needed during dev for faster iterations
const CACHE_BLOCK_SIZE = 100; // keep consistent with helpers.tsx's CACHE_BLOCK_SIZE
// Keep consistent with SamplesList.tsx's DEFAULT_SORT
const SAMPLES_DEFAULT_SORT = {
  colId: "importDate",
  sort: "desc",
} as DashboardRecordSort;
// Keep consistent with SamplesPage.tsx's WES_SAMPLE_CONTEXT
const WES_SAMPLE_CONTEXT = {
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

  // Warm up the cache
  await updateOncotreeCache(inMemoryCache);
  await updateSamplesCache(inMemoryCache);
  logCacheStats(inMemoryCache);

  // Add cache item expiration handlers
  // (node-cache checks for expired items and runs this event listener every 10m by default)
  inMemoryCache.on("expired", async (key) => {
    if (key === ONCOTREE_CACHE_KEY) {
      await updateOncotreeCache(inMemoryCache);
      logCacheStats(inMemoryCache);
    }
    if (key === SAMPLES_CACHE_KEY) {
      await updateSamplesCache(inMemoryCache);
      logCacheStats(inMemoryCache);
    }
  });

  return inMemoryCache;
}

export async function updateOncotreeCache(inMemoryCache: NodeCache) {
  const oncotreeApiData = await fetchOncotreeApiData();
  if (!oncotreeApiData) return;

  const oncotreeCache = oncotreeApiData.reduce((acc, tumor) => {
    acc[tumor.code] = { name: tumor.name, mainType: tumor.mainType };
    return acc;
  }, {} as OncotreeCache);

  // Add to cache the oncotree codes found in Neo4j but not in Oncotree API's response
  // (These codes are likely old codes that have been renamed in the Oncotree database)
  const oncotreeCodesInNeo4j = await getOncotreeCodesFromNeo4j();
  oncotreeCodesInNeo4j?.forEach((code) => {
    if (!oncotreeCache.hasOwnProperty(code)) {
      oncotreeCache[code] = { name: "N/A", mainType: "N/A" };
    }
  });

  inMemoryCache.set(ONCOTREE_CACHE_KEY, oncotreeCache, ONCOTREE_CACHE_TTL);
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

async function updateSamplesCache(inMemoryCache: NodeCache) {
  console.info("Querying and caching select samples data...");

  // Build query bodies for all samples and WES samples queries of Samples page
  const allSamplesQueryBody = buildSamplesQueryBody({
    searchVals: [],
    context: undefined,
    filters: undefined,
    addlOncotreeCodes: [],
  });
  const wesSamplesQueryBody = buildSamplesQueryBody({
    searchVals: [],
    context: WES_SAMPLE_CONTEXT,
    filters: undefined,
    addlOncotreeCodes: [],
  });

  // Run these queries concurrently to reduce server startup time
  const oncotreeCache = inMemoryCache.get(ONCOTREE_CACHE_KEY) as OncotreeCache;
  const allSamplesQueryPromises = buildSamplesQueryPromises({
    queryBody: allSamplesQueryBody,
    oncotreeCache,
  });
  const wesSamplesQueryPromises = buildSamplesQueryPromises({
    queryBody: wesSamplesQueryBody,
    oncotreeCache,
  });
  const queryResults = await Promise.all([
    ...allSamplesQueryPromises,
    ...wesSamplesQueryPromises,
  ]);

  // Add all samples query results to cache
  const samplesCache: SamplesCache = {};
  queryResults.forEach((result) => {
    if (result) {
      Object.assign(samplesCache, result);
    }
  });
  inMemoryCache.set(SAMPLES_CACHE_KEY, samplesCache, SAMPLES_CACHE_TTL);
}

function buildSamplesQueryPromises({
  queryBody,
  oncotreeCache,
}: {
  queryBody: string;
  oncotreeCache: OncotreeCache;
}) {
  const pageIndicesToCache = [...Array(SAMPLES_PAGES_TO_CACHE).keys()]; // [0, 1, 2, ..., n]
  return pageIndicesToCache.map(async (pageIndex) => {
    const samplesCypherQuery = await buildSamplesQueryFinal({
      queryBody,
      sort: SAMPLES_DEFAULT_SORT,
      limit: CACHE_BLOCK_SIZE,
      offset: CACHE_BLOCK_SIZE * pageIndex,
    });
    const queryResult = await queryDashboardSamples({
      samplesCypherQuery,
      oncotreeCache,
    });
    return queryResult ? { [samplesCypherQuery]: queryResult } : null;
  });
}

function logCacheStats(inMemoryCache: NodeCache) {
  const stats = inMemoryCache.getStats();
  console.info(
    `Cache stats: ${stats.keys} keys, ${stats.hits} hits, ${stats.misses} misses, ${stats.ksize}B in key size, ${stats.vsize}B in value size`
  );
}
