import { Express } from "express";
import fs from "fs";
import https from "https";
import { props } from "./constants";
import { buildNeo4jDbSchema } from "../schemas/neo4j";
import { buildCustomSchema } from "../schemas/custom";
import { mergeSchemas } from "@graphql-tools/schema";
import { buildOracleDbSchema } from "../schemas/oracle";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { updateActiveUserSessions } from "./session";
import { corsOptions } from "./constants";
import NodeCache from "node-cache";
import {
  OncotreeCache,
  updateOncotreeCache,
  ONCOTREE_CACHE_KEY,
} from "./oncotree";
import neo4j from "neo4j-driver";
import {
  buildSamplesQueryBody,
  buildSamplesQueryFull,
  queryDashboardSamples,
} from "../schemas/queries/samples";
import { DashboardRecordSort, DashboardSample } from "../generated/graphql";

export function initializeHttpsServer(app: Express) {
  return https.createServer(
    {
      key: fs.readFileSync(props.web_key_pem),
      cert: fs.readFileSync(props.web_cert_pem),
    },
    app
  );
}

export interface ApolloServerContext {
  req: {
    user: any;
    isAuthenticated: boolean;
  };
  inMemoryCache: NodeCache;
}

export const neo4jDriver = neo4j.driver(
  props.neo4j_graphql_uri,
  neo4j.auth.basic(props.neo4j_username, props.neo4j_password),
  { disableLosslessIntegers: true } // maps Cypher Integer to JavaScript Number
);

export async function initializeApolloServer(
  httpsServer: https.Server,
  app: Express
) {
  const { neo4jDbSchema, ogm } = await buildNeo4jDbSchema();
  const customSchema = await buildCustomSchema(ogm);
  const oracleDbSchema = await buildOracleDbSchema();
  const mergedSchema = mergeSchemas({
    schemas: [neo4jDbSchema, oracleDbSchema, customSchema],
  });

  const inMemoryCache = await setUpTheInMemoryCache();

  const apolloServer = new ApolloServer<ApolloServerContext>({
    schema: mergedSchema,
    context: async ({ req }: { req: any }) => {
      updateActiveUserSessions(req);

      return {
        req: {
          user: req.user,
          isAuthenticated: req.isAuthenticated,
        },
        inMemoryCache: inMemoryCache,
      };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer: httpsServer }),
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true,
      }),
    ],
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: corsOptions });
  return apolloServer;
}

export const SAMPLES_CACHE_KEY = "samples";

async function setUpTheInMemoryCache() {
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

// TODO: find an appropriate place to put the code below
export type SamplesCache = Record<string, DashboardSample[]>;

async function updateSamplesCache(inMemoryCache: NodeCache) {
  const samplesCache = {} as SamplesCache;
  const queryBody = buildSamplesQueryBody({
    searchVals: [],
    context: undefined,
    filters: undefined,
    addlOncotreeCodes: [],
  });
  const numOfPagesToCache = 5;
  const agGridCacheBlockSize = 100; // keep this consistent with helpers.tsx's CACHE_BLOCK_SIZE
  for (let i = 0; i < numOfPagesToCache; i++) {
    const offset = i * agGridCacheBlockSize; // [0, 100, 200, 300, 400]
    const samplesCypherQuery = await buildSamplesQueryFull({
      queryBody,
      // Keep this consistent with SamplesList.tsx's DEFAULT_SORT
      sort: { colId: "importDate", sort: "desc" } as DashboardRecordSort,
      limit: agGridCacheBlockSize,
      offset: offset,
    });
    const queryResult = await queryDashboardSamples({
      samplesCypherQuery,
      oncotreeCache: inMemoryCache.get(ONCOTREE_CACHE_KEY),
    });
    if (queryResult) {
      samplesCache[samplesCypherQuery] = queryResult;
    }
  }
  inMemoryCache.set(SAMPLES_CACHE_KEY, samplesCache, 360); // expires every 1 hour
}
