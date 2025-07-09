import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerContext } from "../utils/servers";
import {
  DashboardSampleInput,
  PatientIdsTriplet,
  QueryDashboardCohortsArgs,
  QueryDashboardPatientsArgs,
  QueryDashboardRequestsArgs,
  QueryDashboardSamplesArgs,
} from "../generated/graphql";
import { props } from "../utils/constants";
import { connect, headers, StringCodec } from "nats";
import { OGM } from "@neo4j/graphql-ogm";
import {
  buildPatientsQueryBody,
  buildPatientsQueryFinal,
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
import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { applyMiddleware } from "graphql-middleware";
import { IMiddlewareResolver } from "graphql-middleware/dist/types";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession";
import { queryDatabricks } from "../utils/databricks";

const KEYCLOAK_PHI_ACCESS_GROUP = "mrn-search";
const PHI_ID_MAPPING_TABLE =
  "cdsi_eng_phi.id_mapping.mrn_cmo_dmp_patient_fullouter";
const SEQ_DATES_BY_PATIENT_TABLE =
  "cdsi_eng_phi.msk_impact_dates.anchor_sequencing_date_by_patient";

type AuthMiddleware = {
  Query: {
    dashboardPatients: IMiddlewareResolver;
  };
};

export async function buildCustomSchema(ogm: OGM) {
  const authenticationMiddleware: AuthMiddleware = {
    Query: {
      dashboardPatients: async (
        resolve,
        parent,
        args: QueryDashboardPatientsArgs,
        context: ApolloServerContext,
        info
      ) => {
        if (
          args.phiEnabled &&
          args.searchVals &&
          args.searchVals.length > 0 &&
          !context.req.isAuthenticated()
        ) {
          throw new AuthenticationError(
            "You must be logged in to access this resource."
          );
        }
        return await resolve(parent, args, context, info);
      },
    },
  };

  // TODO: test querying while not under the PHI access group
  const authorizationMiddleware: AuthMiddleware = {
    Query: {
      dashboardPatients: async (
        resolve,
        parent,
        args: QueryDashboardPatientsArgs,
        context: ApolloServerContext,
        info
      ) => {
        if (
          args.phiEnabled &&
          args.searchVals &&
          args.searchVals.length > 0 &&
          !context.req.user.groups.includes(KEYCLOAK_PHI_ACCESS_GROUP)
        ) {
          throw new ForbiddenError(
            "You do not have permission to access this resource. Please contact the SMILE team for assistance."
          );
        }
        return await resolve(parent, args, context, info);
      },
    },
  };

  const resolvers = {
    Query: {
      async dashboardRequests(
        _source: undefined,
        {
          searchVals,
          columnFilters,
          sort,
          limit,
          offset,
        }: QueryDashboardRequestsArgs
      ) {
        const queryBody = buildRequestsQueryBody({ searchVals, columnFilters });
        return await queryDashboardRequests({
          queryBody,
          sort,
          limit,
          offset,
        });
      },

      async dashboardPatients(
        _source: undefined,
        {
          searchVals,
          columnFilters,
          sort,
          limit,
          offset,
          phiEnabled,
        }: QueryDashboardPatientsArgs
      ) {
        const queryBody = buildPatientsQueryBody({ searchVals, columnFilters });
        const queryFinal = buildPatientsQueryFinal({
          queryBody,
          sort,
          limit,
          offset,
        });
        // TODO:
        // - Run query to get sequencing date (see schemas/databricks.ts for reference)
        // - Create some sort of dicts and ref them inside queryDashboardPatients (see queryDashboardSamples for reference)
        //   to return the newly added mrn and seq date fields
        // - Clean up schemas/databricks.ts and anything else that is no longer needed
        // - Look up TODOs throughout the codebase and resolve them
        // - Test by inputting search values, then toggle "phiEnabled" for the first time. Fix if it breaks
        const patientIdsTriplets: PatientIdsTriplet[] = [];
        if (searchVals && searchVals.length > 0 && phiEnabled) {
          const searchValsWithoutCDash = searchVals.map((searchVal) =>
            searchVal.startsWith("C-") ? searchVal.slice(2) : searchVal
          );
          const searchValList = searchValsWithoutCDash
            .map((searchVal) => `'${searchVal}'`)
            .join(",");
          const query = `
            SELECT
              CMO_PATIENT_ID,
              DMP_PATIENT_ID,
              MRN
            FROM
              ${PHI_ID_MAPPING_TABLE}
            WHERE
              DMP_PATIENT_ID IN (${searchValList})
              OR MRN IN (${searchValList})
              OR CMO_PATIENT_ID IN (${searchValList})
          `;
          const queryOptions = { runAsync: true } as ExecuteStatementOptions;
          const res = (await queryDatabricks({
            query,
            queryOptions,
          })) as Array<PatientIdsTriplet>;
          res.forEach((patientIdTriplet) => {
            patientIdTriplet.CMO_PATIENT_ID = `C-${patientIdTriplet.CMO_PATIENT_ID}`;
          });
          patientIdsTriplets.push(...res);
        }
        const patientsData = await queryDashboardPatients(queryFinal);
        const patientIdsTripletMap: Record<string, PatientIdsTriplet> = {};
        patientIdsTriplets.forEach((triplet) => {
          patientIdsTripletMap[triplet.CMO_PATIENT_ID] = triplet;
        });
        const patientsWithMrns = patientsData.map((patient) => {
          return {
            ...patient,
            mrn: patient.cmoPatientId
              ? patientIdsTripletMap[patient.cmoPatientId]?.MRN
              : null,
          };
        });
        return patientsWithMrns;
      },

      async dashboardCohorts(
        _source: undefined,
        {
          searchVals,
          columnFilters,
          sort,
          limit,
          offset,
        }: QueryDashboardCohortsArgs
      ) {
        const queryBody = buildCohortsQueryBody({ searchVals, columnFilters });
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
          columnFilters,
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
          columnFilters,
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

  const executableSchema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers,
  });

  return applyMiddleware(
    executableSchema,
    authenticationMiddleware,
    authorizationMiddleware
  );
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
        dbGapUpdatePromises.push(updateDbGapPromise(dashboardSample));
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
