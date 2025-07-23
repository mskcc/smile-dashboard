import { props } from "../utils/constants";
import { DBSQLClient, DBSQLLogger, LogLevel } from "@databricks/sql";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession";
import { ApolloServerContext } from "./servers";

const { databricks_server_hostname, databricks_http_path, databricks_token } =
  props;
if (!databricks_server_hostname || !databricks_http_path || !databricks_token) {
  throw new Error(
    "Cannot find Databricks environment variables for " +
      "Server Hostname, HTTP Path, or personal access token."
  );
}

const connectOptions = {
  host: databricks_server_hostname,
  path: databricks_http_path,
  token: databricks_token,
};
const logger = new DBSQLLogger({ level: LogLevel.error });
const client = new DBSQLClient({ logger: logger });

export async function queryDatabricks<T>(query: string): Promise<Array<T>> {
  try {
    await client.connect(connectOptions);
    const session = await client.openSession();

    const queryOptions = { runAsync: true } as ExecuteStatementOptions;
    const queryOperation = await session.executeStatement(query, queryOptions);
    const result = await queryOperation.fetchAll();

    await queryOperation.close();
    await session.close();
    await client.close();

    return result as Array<T>;
  } catch (error) {
    await client.close();
    if (error instanceof Error) {
      throw new Error("Error executing query on Databricks: " + error.message);
    }
    return [];
  }
}

/**
 * We use Databricks with serverless compute, which means that the first query to a table can take a
 * longer time to run as Databricks requires spawning a new compute instance first. This function
 * executes a simple query on each Databricks table to reduce the latency from the cold start
 */
export async function warmUpDatabricksTables(
  _req: ApolloServerContext["req"],
  _res: any,
  next: any
): Promise<void> {
  const databricksTablesToWarmUp = [
    props.databricks_phi_id_mapping_table,
    props.databricks_seq_dates_by_patient_table,
  ];
  for (const table of databricksTablesToWarmUp) {
    const query = `SELECT 1 FROM ${table} LIMIT 1`;
    // Execute each query without `await`-ing the result to let the query run quietly in the background
    // and not block the event loop
    queryDatabricks(query).catch((error) =>
      console.error(`Error warming up table ${table}:`, error)
    );
  }
  next();
}
