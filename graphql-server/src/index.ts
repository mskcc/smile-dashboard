import { Express } from "express";
import { buildResolvers } from "./resolvers";
import { buildProps } from "./buildProps";

import { Issuer, Strategy } from "openid-client";
const passport = require("passport");
const expressSession = require("express-session");

const fetch = require("node-fetch");
const ApolloClient = require("apollo-client").ApolloClient;
const createHttpLink = require("apollo-link-http").createHttpLink;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const cors = require("cors");

const path = require("path");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server-express");
const { toGraphQLTypeDefs } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");

const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} = require("apollo-server-core");
const { OGM } = require("@neo4j/graphql-ogm");

const props = buildProps();

const driver = neo4j.driver(
  props.neo4j_graphql_uri,
  neo4j.auth.basic(props.neo4j_username, props.neo4j_password)
);

const sessionFactory = () =>
  driver.session({ defaultAccessMode: neo4j.session.WRITE });

// OracleDB requires node-oracledb's Thick mode & the Oracle Instant Client, which is unavailable for M1 Macs
let oracledb: any = null;
const os = require("os");
if (os.arch() !== "arm64") {
  oracledb = require("oracledb");
  oracledb.initOracleClient();
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
}

async function main() {
  const app: Express = express();
  app.use(express.static(path.resolve(__dirname, "../build")));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json({ limit: "50mb" })); // increase to support bulk searching
  app.use(cors());

  const keycloakIssuer = await Issuer.discover(
    "https://smile-dev.mskcc.org:8443/realms/smile"
  );

  const keycloakClient = new keycloakIssuer.Client({
    client_id: "smile-dashboard-test",
    client_secret: "long_secret-here", // placeholder
    redirect_uris: ["http://localhost:4001/auth/callback"],
    post_logout_redirect_uris: ["http://localhost:4001/logout/callback"],
    response_types: ["code"],
  });

  const memoryStore = new expressSession.MemoryStore();
  app.use(
    expressSession({
      secret: "another_long_secret", // placeholder
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    })
  );

  app.use(passport.initialize());
  app.use(passport.authenticate("session"));

  passport.use(
    "oidc",
    new Strategy(
      { client: keycloakClient },
      (tokenSet: any, userinfo: any, done: any) => {
        return done(null, tokenSet.claims()); // look more under the hood what this is doing; might use this to check the user's role
      }
    )
  );

  passport.serializeUser(function (user: any, done: any) {
    done(null, user);
  });
  passport.deserializeUser(function (user: any, done: any) {
    done(null, user);
  });

  app.get("/login", (req, res, next) => {
    passport.authenticate("oidc")(req, res, next);
  });

  app.get("/auth/callback", (req, res, next) => {
    passport.authenticate("oidc", {
      successRedirect: "/post-login",
      failureRedirect: "/",
    })(req, res, next);
  });

  // middleware to check if user is authenticated using passport
  const checkAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.status(401).send("401 Unauthorized");
    }
  };

  app.get("/post-login", checkAuthenticated, (req: any, res) => {
    const userEmail = req.user.email;

    res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify(
          userEmail
        )}, "http://localhost:3006/patients");
        window.onload = function() {
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
      You are logged in.
    `);
  });

  app.get("/logout", (req, res) => {
    res.redirect(keycloakClient.endSessionUrl());
  });

  app.get("/logout/callback", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  app.post("/mrn-search", checkAuthenticated, async (req, res) => {
    const patientMrns = req.body;
    const patientIdsTriplets = [];

    if (os.arch() !== "arm64" && oracledb !== null) {
      const connection = await oracledb.getConnection({
        user: props.oracle_user,
        password: props.oracle_password,
        connectString: props.oracle_connect_string,
      });

      for (const patientMrn of patientMrns) {
        const result = await connection.execute(
          "SELECT CMO_ID, DMP_ID, PT_MRN FROM CRDB_CMO_LOJ_DMP_MAP WHERE :patientMrn IN (DMP_ID, PT_MRN, CMO_ID)",
          { patientMrn }
        );
        if (result.rows.length > 0) {
          patientIdsTriplets.push(result.rows[0]);
        }
      }
      await connection.close();
    }

    res.sendStatus(200);
    res.send(patientIdsTriplets);
    return;
  });

  // for health check
  app.get("/", (req, res) => {
    res.sendStatus(200);
  });

  const httpLink = createHttpLink({
    uri: "http://localhost:4001/graphql",
    fetch: fetch,
  });

  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  const httpServer = http.createServer(app);
  const typeDefs = await toGraphQLTypeDefs(sessionFactory, false);
  const ogm = new OGM({ typeDefs, driver });
  const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    config: {
      skipValidateTypeDefs: true,
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    resolvers: buildResolvers(ogm, client),
  });

  Promise.all([neoSchema.getSchema(), ogm.init()]).then(async ([schema]) => {
    const server = new ApolloServer({ schema });
    await server.start();
    server.applyMiddleware({ app });
    await new Promise((resolve) => httpServer.listen({ port: 4001 }, resolve));
    console.log(
      `🚀 Server ready at http://localhost:4001${server.graphqlPath}`
    );
  });
}

main();
