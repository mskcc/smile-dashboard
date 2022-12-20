const path = require("path");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer, gql } = require("apollo-server-express");
const { toGraphQLTypeDefs } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");
const { connect, StringCodec } = require("nats");
var PropertiesReader = require("properties-reader");
var properties = new PropertiesReader(
  path.resolve(__dirname, "./env/application.properties")
);
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault
} = require("apollo-server-core");
const { OGM } = require("@neo4j/graphql-ogm");

const smileResolvers = require("./resolvers");

// neo4j connection properties
const neo4j_graphql_uri = properties.get("db.neo4j_graphql_uri");
const neo4j_username = properties.get("db.neo4j_username");
const neo4j_password = properties.get("db.neo4j_password");

// nats connection properties
const nats_username = properties.get("conn.nats_username");
const nats_password = properties.get("conn.nats_password");
const nats_key_pem = properties.get("conn.nats_key_pem");
const nats_cert_pem = properties.get("conn.nats_cert_pem");
const nats_ca_pem = properties.get("conn.nats_ca_pem");
const nats_url = properties.get("conn.nats_url");

// pub-sub topics
const pub_validate_request_update = properties.get(
  "topics.pub_validate_igo_request_update"
);
const pub_validate_sample_update = properties.get(
  "topics.pub_validate_igo_sample_update"
);
const sub_cmo_request_update = properties.get(
  "topics.sub_consumers_cmo_request_update"
);
const sub_cmo_sample_update = properties.get(
  "topics.sub_consumers_cmo_sample_update"
);

const sc = StringCodec();

async function printMsgs(s) {
  let subj = s.getSubject();
  console.log(`listening for ${subj}`);
  const c = 13 - subj.length;
  const pad = "".padEnd(c);
  for await (const m of s) {
    console.log(
      `[${subj}]${pad} #${s.getProcessed()} - ${m.subject} ${
        m.data ? " " + sc.decode(m.data) : ""
      }`
    );
  }
}

const tlsOptions = {
  keyFile: nats_key_pem,
  certFile: nats_cert_pem,
  caFile: nats_ca_pem
};

const natsConnProperties = {
  servers: [nats_url],
  user: nats_username,
  pass: nats_password,
  tls: tlsOptions
};

var nc = null;
async function establishConnection() {
  try {
    const natsConn = await connect(natsConnProperties);
    nc = natsConn;
    console.log("Connected to server: ");
    console.log(natsConn.getServer());

    // setting up subscribers
    const sub_req_update = natsConn.subscribe(sub_cmo_request_update);
    (async () => {
      for await (const m of sub_req_update) {
        console.log(`[${sub_req_update.getProcessed()}]: ${sc.decode(m.data)}`);
      }
      // TODO: SET REQUEST STATE TO READY
    })();

    const sub_sample_update = natsConn.subscribe(sub_cmo_sample_update);
    (async () => {
      for await (const m of sub_sample_update) {
        console.log(`[${sub_req_update.getProcessed()}]: ${sc.decode(m.data)}`);
      }
      // TODO: SET SAMPLE STATE TO READY
    })();

    // TODO: set up publisher to publish on sample/request update topics
    // const message = JSON.stringify({message});
    // console.log("publishing message", message);
    // natsConn.publish(
    //   "TOPIC TO PUBLISH TO",
    //   sc.encode(message)
    // );
  } catch (err) {
    console.log(
      `error connecting to ${JSON.stringify(natsConnProperties)}`,
      err
    );
  }
}

const driver = neo4j.driver(
  neo4j_graphql_uri,
  neo4j.auth.basic(neo4j_username, neo4j_password)
);

const sessionFactory = () =>
  driver.session({ defaultAccessMode: neo4j.session.WRITE });

// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
  establishConnection(); // for nats only
  const typeDefs = await toGraphQLTypeDefs(sessionFactory, false);
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  const ogm = new OGM({ typeDefs, driver });
  ogm.init();

  const app = express();
  app.use(express.static(path.resolve(__dirname, "../build")));

  app.use(bodyParser.urlencoded({ extended: true }));
  // for health check
  app.get("/", (req, res) => {
    res.sendStatus(200);
  });

  // custom mutation resolver for updating the sample revisable status to false
  app.get("/mutation/sample/:smileSampleId", async (req, res) => {
    const response = await server.executeOperation({
      query: smileResolvers.sampleRevisableMutationQuery,
      variables: {
        where: { smileSampleId: req.params.smileSampleId },
        update: { revisable: false }
      }
    });
    // response from apollo grapqhl returns the smile sample id and its updated
    // revisable status meaning that if revisable != false then the mutation failed
    if (!response.data.updateSamples.samples[0].revisable) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });

  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
    context: ({ req }) => ({ req }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ],
    resolvers: smileResolvers.resolvers
  });

  neoSchema.getSchema().then(schema => {
    const server = new ApolloServer({
      schema
    });
  });
  await server.start();
  server.applyMiddleware({ app });
  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

main();
