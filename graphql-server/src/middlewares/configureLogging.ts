import { Express } from "express";
import path from "path";
const morgan = require("morgan");
import fs from "fs";
import { props } from "../utils/constants";
import { ApolloServerContext } from "../utils/servers";

/**
 * Log only PHI queries from logged in users
 */
export function configureLogging(app: Express) {
  const logDir = path.join(process.env.SMILE_DATA_HOME!, props.log_dir);

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const accessLogStream = fs.createWriteStream(path.join(logDir, "event.log"), {
    flags: "a+",
  });

  morgan.token("keycloak-user-id", (req: ApolloServerContext["req"]) => {
    return `Keycloak user ID: ${req.user?.sub || "N/A"}`;
  });

  morgan.token("graphql-query", (req: ApolloServerContext["req"]) => {
    const { operationName } = req.body;
    return `GraphQL query: ${operationName || "N/A"}`;
  });

  app.use(
    morgan(
      ":method :url :status - :date[iso] - :keycloak-user-id - :graphql-query",
      {
        stream: accessLogStream,
        skip: (req: ApolloServerContext["req"]) => {
          if (
            req.user &&
            req.body.operationName === "DashboardPatients" &&
            req.body.variables.phiEnabled === true
          ) {
            return false;
          }
          return true;
        },
      }
    )
  );
}
