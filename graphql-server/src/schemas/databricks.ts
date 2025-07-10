import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { IMiddlewareResolver } from "graphql-middleware/dist/types";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession";
import { queryDatabricks } from "../utils/databricks";
import { PatientIdsTriplet } from "../generated/graphql";

const KEYCLOAK_PHI_ACCESS_GROUP = "mrn-search";
const PHI_ID_MAPPING_TABLE =
  "cdsi_eng_phi.id_mapping.mrn_cmo_dmp_patient_fullouter";

export async function buildDatabricksSchema() {
  const authenticationMiddleware: {
    Query: {
      patientIdsTriplets: IMiddlewareResolver;
    };
  } = {
    Query: {
      patientIdsTriplets: async (resolve, parent, args, context, info) => {
        const req = context.req;

        if (req.isAuthenticated()) {
          // continues to the next middleware or resolver
          const result = await resolve(parent, args, context, info);
          return result;
        } else {
          throw new AuthenticationError("401");
        }
      },
    },
  };

  const authorizationMiddleware: {
    Query: {
      patientIdsTriplets: IMiddlewareResolver;
    };
  } = {
    Query: {
      patientIdsTriplets: async (resolve, parent, args, context, info) => {
        const req = context.req;

        if (req.user.groups.includes(KEYCLOAK_PHI_ACCESS_GROUP)) {
          // continues to the next middleware or resolver
          const result = await resolve(parent, args, context, info);
          return result;
        } else {
          throw new ForbiddenError("403");
        }
      },
    },
  };

  const resolvers = {
    Query: {
      patientIdsTriplets: async (
        _: any,
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
          console.error("Error querying Patient ID triplets:", error);
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

    type Query {
      patientIdsTriplets(patientIds: [String!]!): [PatientIdsTriplet]
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
