import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { IMiddlewareResolver } from "graphql-middleware/dist/types";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession";
import { queryDatabricks } from "../utils/databricks";
import {
  AnchorSeqDateByDmpPatientId,
  PatientIdsTriplet,
  QueryAnchorSeqDatesByDmpPatientIdsArgs,
  QueryPatientIdsTripletsArgs,
} from "../generated/graphql";
import { ApolloServerContext } from "../utils/servers";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

const KEYCLOAK_PHI_ACCESS_GROUP = "mrn-search";
const PHI_ID_MAPPING_TABLE =
  "cdsi_eng_phi.id_mapping.mrn_cmo_dmp_patient_fullouter";
const SEQ_DATES_BY_PATIENT_TABLE =
  "cdsi_eng_phi.msk_impact_dates.anchor_sequencing_date_by_patient";

type DatabricksQueryMiddlewareResolvers = {
  Query: {
    patientIdsTriplets: IMiddlewareResolver;
  };
};

async function requireAuthentication(
  resolve: any,
  parent: any,
  args: QueryPatientIdsTripletsArgs | QueryAnchorSeqDatesByDmpPatientIdsArgs,
  context: ApolloServerContext,
  info: any
) {
  if (context.req.isAuthenticated()) {
    return await resolve(parent, args, context, info);
  } else {
    throw new AuthenticationError("401");
  }
}

function requireAuthorization(group: string) {
  return async (
    resolve: any,
    parent: any,
    args: QueryPatientIdsTripletsArgs | QueryAnchorSeqDatesByDmpPatientIdsArgs,
    context: ApolloServerContext,
    info: any
  ) => {
    if (context.req.user.groups.includes(group)) {
      return await resolve(parent, args, context, info);
    } else {
      throw new ForbiddenError("403");
    }
  };
}

export async function buildDatabricksSchema(
  apolloClient: ApolloClient<NormalizedCacheObject>
) {
  const authenticationMiddleware: DatabricksQueryMiddlewareResolvers = {
    Query: {
      patientIdsTriplets: requireAuthentication,
    },
  };

  const authorizationMiddleware: DatabricksQueryMiddlewareResolvers = {
    Query: {
      patientIdsTriplets: requireAuthorization(KEYCLOAK_PHI_ACCESS_GROUP),
    },
  };

  const resolvers = {
    Query: {
      /**
       * TODO: Delete after dev
       * Example usage:
       *  const result = await client.query({
       *    query: GetPatientIdsTripletsDocument,
       *    variables: { patientIds: [<insert patient IDs here>] }
       *  });
       *  const data = result.data.patientIdsTriplets as Array<PatientIdsTriplet>;
       */
      patientIdsTriplets: async (
        _source: undefined,
        { patientIds }: { patientIds: Array<String> }
      ) => {
        try {
          const patientIdList = patientIds
            .map((patientId) => `'${patientId}'`)
            .join(",");
          const query = `
            SELECT CMO_PATIENT_ID, DMP_PATIENT_ID, MRN
            FROM ${PHI_ID_MAPPING_TABLE}
            WHERE DMP_PATIENT_ID IN (${patientIdList})
              OR MRN IN (${patientIdList})
              OR CMO_PATIENT_ID IN (${patientIdList})
          `;
          const queryOptions = { runAsync: true } as ExecuteStatementOptions;
          const res = await queryDatabricks({ query, queryOptions });
          return res as Array<PatientIdsTriplet>;
        } catch (error) {
          console.error(
            `Error querying Databricks table ${PHI_ID_MAPPING_TABLE}:`,
            error
          );
          return [];
        }
      },
      anchorSeqDatesByDmpPatientIds: async (
        _source: undefined,
        { dmpPatientIds }: { dmpPatientIds: Array<String> }
      ) => {
        try {
          const dmpPatientIdsList = dmpPatientIds
            .map((dmpPatientId) => `'${dmpPatientId}'`)
            .join(",");
          const query = `
            SELECT DMP_PATIENT_ID, ANCHOR_SEQUENCING_DATE
            FROM ${SEQ_DATES_BY_PATIENT_TABLE}
            WHERE DMP_PATIENT_ID IN (${dmpPatientIdsList})
          `;
          const queryOptions = { runAsync: true } as ExecuteStatementOptions;
          const res = await queryDatabricks({ query, queryOptions });
          return res as Array<AnchorSeqDateByDmpPatientId>;
        } catch (error) {
          console.error(
            `Error querying Databricks table ${SEQ_DATES_BY_PATIENT_TABLE}:`,
            error
          );
          return [];
        }
      },
    },
  };

  const typeDefs = `
    type PatientIdsTriplet {
      CMO_PATIENT_ID: String!
      DMP_PATIENT_ID: String
      MRN: String!
    }

    type AnchorSeqDateByDmpPatientId {
      DMP_PATIENT_ID: String!
      ANCHOR_SEQUENCING_DATE: String!
    }

    type Query {
      patientIdsTriplets(patientIds: [String!]!): [PatientIdsTriplet]
      anchorSeqDatesByDmpPatientIds(dmpPatientIds: [String!]!): [AnchorSeqDateByDmpPatientId]
    }
  `;

  const schema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers,
  });

  return applyMiddleware(
    schema,
    authenticationMiddleware,
    authorizationMiddleware
  );
}
