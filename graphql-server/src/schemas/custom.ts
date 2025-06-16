import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerContext } from "../utils/servers";
import {
  AgGridSortDirection,
  DashboardSampleInput,
  QueryDashboardCohortsArgs,
  QueryDashboardPatientsArgs,
  QueryDashboardRequestsArgs,
  QueryDashboardSamplesArgs,
  DashboardRecordSort,
  InputMaybe,
  DashboardRecordFilter,
} from "../generated/graphql";
import { props } from "../utils/constants";
import { connect, headers, StringCodec } from "nats";
import { OGM } from "@neo4j/graphql-ogm";
import {
  buildPatientsQueryBody,
  queryDashboardPatients,
} from "./queries/patients";
import {
  buildCohortsQueryBody,
  queryDashboardCohorts,
} from "./queries/cohorts";
import {
  buildSamplesQueryBody,
  buildSamplesQueryFinal,
  getAddlOtCodesMatchingCtOrCtdVals,
  queryDashboardSamples,
} from "./queries/samples";
import {
  ONCOTREE_CACHE_KEY,
  OncotreeCache,
  SAMPLES_CACHE_KEY,
  SamplesCache,
  updateCacheWithNewSampleUpdates,
} from "../utils/cache";
import {
  buildRequestsQueryBody,
  queryDashboardRequests,
} from "./queries/requests";
import { typeDefs } from "../utils/typeDefs";
const request = require("request-promise-native");

export async function buildCustomSchema(ogm: OGM) {
  const resolvers = {
    Query: {
      async dashboardRequests(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardRequestsArgs
      ) {
        const queryBody = buildRequestsQueryBody({ searchVals, filters });
        return await queryDashboardRequests({
          queryBody,
          sort,
          limit,
          offset,
        });
      },

      async dashboardPatients(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardPatientsArgs
      ) {
        const queryBody = buildPatientsQueryBody({ searchVals, filters });
        return await queryDashboardPatients({
          queryBody,
          sort,
          limit,
          offset,
        });
      },

      async dashboardCohorts(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardCohortsArgs
      ) {
        const queryBody = buildCohortsQueryBody({ searchVals, filters });
        return await queryDashboardCohorts({
          queryBody,
          sort,
          limit,
          offset,
        });
      },

      async dashboardSamples(
        _source: undefined,
        {
          searchVals,
          contexts,
          sort,
          filters,
          limit,
          offset,
        }: QueryDashboardSamplesArgs,
        { inMemoryCache }: ApolloServerContext
      ) {
        const oncotreeCache = inMemoryCache.get(
          ONCOTREE_CACHE_KEY
        ) as OncotreeCache;
        const samplesCache = inMemoryCache.get(
          SAMPLES_CACHE_KEY
        ) as SamplesCache;

        const addlOncotreeCodes = getAddlOtCodesMatchingCtOrCtdVals({
          searchVals,
          oncotreeCache,
        });

        const queryBody = buildSamplesQueryBody({
          searchVals,
          contexts,
          filters,
          addlOncotreeCodes,
        });

        const samplesCypherQuery = buildSamplesQueryFinal({
          queryBody,
          sort,
          limit,
          offset,
        });

        if (samplesCache && samplesCypherQuery in samplesCache) {
          return samplesCache[samplesCypherQuery];
        }

        return await queryDashboardSamples({
          samplesCypherQuery,
          oncotreeCache,
        });
      },
    },

    Mutation: {
      async updateDashboardSamples(
        _source: undefined,
        {
          newDashboardSamples,
        }: { newDashboardSamples: DashboardSampleInput[] },
        { inMemoryCache }: ApolloServerContext
      ) {
        await updateAllSamplesConcurrently(newDashboardSamples, ogm);
        await updateCacheWithNewSampleUpdates(
          newDashboardSamples,
          inMemoryCache
        );

        // Here, we're returning newDashboardSamples for simplicity. However, if we were to follow
        // GraphQL's convention, we'd return the actual resulting data from the database update. This
        // means we'd wait for SMILE services to finish processing the data changes, then query that
        // data to return it to the frontend. For more context, see:
        // https://www.apollographql.com/docs/react/performance/optimistic-ui/#optimistic-mutation-lifecycle
        return newDashboardSamples;
      },
    },
  };

  return makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers,
  });
}

export function buildCypherPredicateFromColumnDateFilter({
  filters,
  filterField,
  dateVar,
  safelyHandleDateString = false,
}: {
  filters: InputMaybe<DashboardRecordFilter[]> | undefined;
  filterField: DashboardRecordFilter["field"];
  /** The date variable in the current Cypher context e.g. `bc.date` from `MATCH (bc:BamComplete) RETURN bc.date` */
  dateVar: string;
  /** Set this to true when working with date values that are unpredictable/non-standardized */
  safelyHandleDateString?: boolean;
}) {
  const filterObj = filters?.find((filter) => filter.field === filterField);
  if (!filterObj) return "";
  const filter = JSON.parse(filterObj.filter); // as AG Grid's DateFilterModel type

  const formattedDateString = safelyHandleDateString
    ? `
    CASE
      WHEN size(${dateVar}) >= 10 THEN left(${dateVar}, 10) // trims date formats more granular than yyyy-MM-dd
      ELSE '1900-01-01' // excludes record from the result
    END`
    : dateVar;

  return `
      apoc.date.parse(${formattedDateString}, 'ms', 'yyyy-MM-dd')
        >= apoc.date.parse('${filter.dateFrom}', 'ms', 'yyyy-MM-dd HH:mm:ss') // AG Grid's provided date format
      AND apoc.date.parse(${formattedDateString}, 'ms', 'yyyy-MM-dd')
        <= apoc.date.parse('${filter.dateTo}', 'ms', 'yyyy-MM-dd HH:mm:ss')
    `;
}

/**
 * Build boolean predicates to be used in a WHERE clause in Cypher.
 *
 * @param booleanVar The boolean variable in the current Cypher context e.g. `t.billed` from `MATCH (t:Tempo) RETURN t.billed`
 * @param filter The filter object type from AG Grid's `agSetColumnFilter`
 * @param noIncludesFalseAndNull Set this to true if we want the user's filter selection of "No" to include both false and null values
 * @param trueVal The true value that appears in the database for a given field (e.g. "Yes", true)
 * @param falseVal The false value that appears in the database for a given field (e.g. "No", false)
 *
 */
export function buildCypherBooleanFilter({
  booleanVar,
  filter,
  noIncludesFalseAndNull = false,
  trueVal = true,
  falseVal = false,
}: {
  booleanVar: string;
  filter: {
    values: string[];
  };
  noIncludesFalseAndNull?: boolean;
  trueVal?: string | boolean;
  falseVal?: string | boolean;
}) {
  const formattedTrueVal =
    typeof trueVal === "string" ? `'${trueVal}'` : trueVal;
  const formattedFalseVal =
    typeof falseVal === "string" ? `'${falseVal}'` : falseVal;

  const filterValues = filter.values;
  if (filterValues?.length > 0) {
    const activeFilters = [];
    for (const value of filterValues) {
      if (value === "Yes") {
        activeFilters.push(`${booleanVar} = ${formattedTrueVal}`);
      } else if (value === "No") {
        if (!noIncludesFalseAndNull) {
          activeFilters.push(`${booleanVar} = ${formattedFalseVal}`);
        } else {
          activeFilters.push(
            `${booleanVar} = ${formattedFalseVal} OR ${booleanVar} IS NULL`
          );
        }
      } else if (value === null) {
        activeFilters.push(`${booleanVar} IS NULL`);
      }
    }
    return activeFilters.join(" OR ");
  } else {
    return `${booleanVar} <> ${formattedTrueVal} AND ${booleanVar} <> ${formattedFalseVal} AND ${booleanVar} IS NOT NULL`;
  }
}

export function buildFinalCypherFilter({
  queryFilters,
}: {
  queryFilters: string[];
}) {
  const combinedPredicates = queryFilters
    .filter(Boolean)
    .map((queryFilter) => `(${queryFilter})`)
    .join(" AND ");

  return combinedPredicates ? "WHERE " + combinedPredicates : "";
}

/**
 * Disable Neo4j's defaults of showing nulls first for DESC sorting
 * and empty strings first for ASC sorting
 */
export function getNeo4jCustomSort(sort: DashboardRecordSort) {
  return sort.sort === AgGridSortDirection.Desc
    ? `COALESCE(resultz.${sort.colId}, '') DESC`
    : `resultz.${sort.colId}='' ASC, resultz.${sort.colId} ASC`;
}

async function updateSampleMetadataPromises(
  newDashboardSamples: Array<DashboardSampleInput>,
  ogm: OGM
) {
  const sampleManifests: any[] = [];
  for (const newDashboardSample of newDashboardSamples) {
    const sampleManifest = await request(
      props.smile_sample_endpoint + newDashboardSample.primaryId,
      {
        json: true,
      }
    );

    Object.keys(newDashboardSample).forEach((key) => {
      if (key in sampleManifest) {
        sampleManifest[key] =
          newDashboardSample[key as keyof DashboardSampleInput];
      }
    });

    // Ensure validator and label generator use latest status data added during validation
    delete sampleManifest.status;

    // Ensure isCmoSample is set in sample's 'additionalProperties' if not already present
    if (sampleManifest.additionalProperties.isCmoSample == null) {
      // For research samples, this ensures that they get sent to the label generator after
      // validation as some of the older SMILE samples do not have this additionalProperty set
      if (sampleManifest.datasource === "igo") {
        const requestId = sampleManifest.additionalProperties.igoRequestId;
        let requestOgm = ogm.model("Request");
        const requestOfSample = await requestOgm.find({
          where: { igoRequestId: requestId },
        });
        sampleManifest.additionalProperties.isCmoSample =
          requestOfSample[0].isCmoRequest.toString();
      }

      if (sampleManifest.datasource === "dmp") {
        sampleManifest.additionalProperties.isCmoSample = false;
      }
    }

    await ogm.model("Sample").update({
      where: { smileSampleId: sampleManifest.smileSampleId },
      update: { revisable: false },
    });

    sampleManifests.push(sampleManifest);
  }

  return new Promise(async (resolve) => {
    publishNatsMessage(
      props.pub_validate_sample_update,
      JSON.stringify(sampleManifests)
    );
    resolve(null);
  });
}

async function updateTempoPromise(newDashboardSample: DashboardSampleInput) {
  return new Promise((resolve) => {
    const dataForTempoBillingUpdate = {
      primaryId: newDashboardSample.primaryId,
      billed: newDashboardSample.billed,
      billedBy: newDashboardSample.billedBy,
      costCenter: newDashboardSample.costCenter,
      accessLevel: newDashboardSample.accessLevel,
      custodianInformation: newDashboardSample.custodianInformation,
    };

    publishNatsMessage(
      props.pub_tempo_sample_billing,
      JSON.stringify(dataForTempoBillingUpdate)
    );

    resolve(null);
  });
}

async function updateDbGapPromise(newDashboardSample: DashboardSampleInput) {
  return new Promise((resolve) => {
    const dataForDbGapUpdate = {
      primaryId: newDashboardSample.primaryId,
      dbGapStudy: newDashboardSample.dbGapStudy,
    };

    publishNatsMessage(
      props.pub_dbgap_sample_update,
      JSON.stringify(dataForDbGapUpdate)
    );

    resolve(null);
  });
}

const EDITABLE_SAMPLEMETADATA_FIELDS = new Set([
  "cmoPatientId",
  "investigatorSampleId",
  "sampleType",
  "preservation",
  "tumorOrNormal",
  "sampleClass",
  "oncotreeCode",
  "collectionYear",
  "sampleOrigin",
  "tissueLocation",
  "sex",
]);

const EDITABLE_TEMPO_FIELDS = new Set([
  "billed",
  "costCenter",
  "billedBy",
  "custodianInformation",
  "accessLevel",
]);

const EDITABLE_DBGAP_FIELDS = new Set(["dbGapStudy"]);

async function updateAllSamplesConcurrently(
  newDashboardSamples: DashboardSampleInput[],
  ogm: OGM
) {
  const samplesWithMetadataUpdates = [];
  const tempoUpdatePromises = [];
  const dbGapUpdatePromises = [];

  for (const dashboardSample of newDashboardSamples) {
    try {
      const { changedFieldNames } = dashboardSample;

      const metadataChanged = changedFieldNames.some((field) =>
        EDITABLE_SAMPLEMETADATA_FIELDS.has(field)
      );
      const tempoChanged = changedFieldNames.some((field) =>
        EDITABLE_TEMPO_FIELDS.has(field)
      );
      const dbGapChanged = changedFieldNames.some((field) =>
        EDITABLE_DBGAP_FIELDS.has(field)
      );

      if (metadataChanged) {
        samplesWithMetadataUpdates.push(dashboardSample);
      }
      if (tempoChanged) {
        tempoUpdatePromises.push(updateTempoPromise(dashboardSample));
      }
      if (dbGapChanged) {
        dbGapUpdatePromises.push(updateTempoPromise(dashboardSample));
      }
    } catch (error) {
      console.error(
        `Failed to update sample with primaryId ${dashboardSample.primaryId}. Error:`,
        error
      );
      throw error; // ensure Promise.allSettled captures the error
    }
  }
  const allPromises = [...tempoUpdatePromises, ...dbGapUpdatePromises];
  if (samplesWithMetadataUpdates.length > 0) {
    allPromises.push(
      updateSampleMetadataPromises(samplesWithMetadataUpdates, ogm)
    );
  }
  await Promise.allSettled(allPromises);
}

async function publishNatsMessage(topic: string, message: string) {
  const sc = StringCodec();

  const tlsOptions = {
    keyFile: props.nats_key_pem,
    certFile: props.nats_cert_pem,
    caFile: props.nats_ca_pem,
    rejectUnauthorized: false,
  };

  const natsConnProperties = {
    servers: [props.nats_url],
    user: props.nats_username,
    pass: props.nats_password,
    tls: tlsOptions,
  };

  try {
    const natsConn = await connect(natsConnProperties);
    console.info(
      `Publishing message to NATS server at ${natsConn.getServer()} under topic ${topic}: `,
      message
    );
    const h = headers();
    h.append("Nats-Msg-Subject", topic);
    natsConn.publish(topic, sc.encode(JSON.stringify(message)), { headers: h });
  } catch (err) {
    console.error(
      `error connecting to ${JSON.stringify(natsConnProperties)}`,
      err
    );
  }
}
