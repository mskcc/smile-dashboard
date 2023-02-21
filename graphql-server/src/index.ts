import { Express } from "express";

const path = require("path");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server-express");
const { toGraphQLTypeDefs } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");
const { connect, StringCodec } = require("nats");
var PropertiesReader = require("properties-reader");
var properties = new PropertiesReader(
  path.resolve(__dirname, "../dist/env/application.properties")
);
const request = require("request");
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} = require("apollo-server-core");
const { OGM } = require("@neo4j/graphql-ogm");

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
const pub_validate_sample_update = properties.get(
  "topics.pub_validate_igo_sample_update"
);

// smile sample endpoint
const smile_sample_endpoint = properties.get("smile.smile_sample_endpoint");

const sc = StringCodec();

const tlsOptions = {
  keyFile: nats_key_pem,
  certFile: nats_cert_pem,
  caFile: nats_ca_pem,
  rejectUnauthorized: false,
};

const natsConnProperties = {
  servers: [nats_url],
  user: nats_username,
  pass: nats_password,
  tls: tlsOptions,
};

const natsConn = connect(natsConnProperties);

async function publishNatsMessage(topic: String, message: String) {
  try {
    const natsConn = await connect(natsConnProperties);
    console.log("Connected to server: ");
    console.log(natsConn.getServer());
    // setting up subscribers
    // const sub_req_update = natsConn.subscribe(sub_cmo_request_update);
    // (async () => {
    //   for await (const m of sub_req_update) {
    //     console.log(`[${sub_req_update.getProcessed()}]: ${sc.decode(m.data)}`);
    //   }
    //   // TODO: SET REQUEST STATE TO READY
    // })();
    //
    // const sub_sample_update = natsConn.subscribe(sub_cmo_sample_update);
    // (async () => {
    //   for await (const m of sub_sample_update) {
    //     console.log(`[${sub_req_update.getProcessed()}]: ${sc.decode(m.data)}`);
    //   }
    //   // TODO: SET SAMPLE STATE TO READY
    // })();

    // TODO: set up publisher to publish on sample/request update topics
    // const message = JSON.stringify({message});
    console.log("publishing message: ", message);
    natsConn.publish(topic, sc.encode(message));
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

async function main() {
  const app: Express = express();
  app.use(express.static(path.resolve(__dirname, "../build")));
  app.use(bodyParser.urlencoded({ extended: true }));

  // for health check
  app.get("/", (req, res) => {
    res.sendStatus(200);
  });

  const httpServer = http.createServer(app);
  const typeDefs = await toGraphQLTypeDefs(sessionFactory, false);
  const ogm = new OGM({ typeDefs, driver });
  const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    resolvers: {
      Mutation: {
        updateSamples: async (_source: any, { where, update }: any) => {
          request(
            smile_sample_endpoint + where.smileSampleId,
            { json: true },
            (err: any, res: any) => {
              if (err) {
                return console.log(err);
              }
              // set revisable to false for sample
              let sample = ogm.model("Sample");
              sample.find({ where: { smileSampleId: where.smileSampleId } });
              // get latest sample metadata and apply updates provided through mutation
              let sampleData = res.body;
              const smdataupdates =
                update.hasMetadataSampleMetadata[0].update.node;
              Object.keys(smdataupdates).forEach((key: string) => {
                sampleData[key] = smdataupdates[key];
              });

              // publish sample update to nats server
              console.log("publishing message", JSON.stringify(sampleData));
              publishNatsMessage(
                pub_validate_sample_update,
                JSON.stringify(sampleData)
              );
              return { samples: [sampleData] };
            }
          );
        },
      },
    },
  });

  Promise.all([neoSchema.getSchema(), ogm.init()]).then(async ([schema]) => {
    const server = new ApolloServer({
      schema,
    });
    await server.start();
    server.applyMiddleware({ app });
    await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
    console.log(
      `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
    );
  });
}

main();
function useState(arg0: never[]): [any, any] {
  throw new Error("Function not implemented.");
}

function useEffect(arg0: () => void, arg1: never[]) {
  throw new Error("Function not implemented.");
}
