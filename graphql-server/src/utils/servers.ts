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
  oncotreeCache: OncotreeCache;
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
        oncotreeCache: inMemoryCache.get(ONCOTREE_CACHE_KEY),
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

async function setUpTheInMemoryCache() {
  const inMemoryCache = new NodeCache();
  await updateOncotreeCache(inMemoryCache);
  // Functions to run when items in cache expire
  // (node-cache checks for expired items and runs this event listener every 10m by default)
  inMemoryCache.on("expired", (key) => {
    if (key === ONCOTREE_CACHE_KEY) {
      console.info("Refreshing the Oncotree cache...");
      updateOncotreeCache(inMemoryCache);
    }
  });
  return inMemoryCache;
}
