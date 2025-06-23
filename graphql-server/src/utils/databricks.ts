import { props } from "../utils/constants";
import { DBSQLClient } from "@databricks/sql";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession";

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

export async function queryDatabricks({
  query,
  queryOptions,
}: {
  query: string;
  queryOptions?: ExecuteStatementOptions;
}) {
  const client = new DBSQLClient();
  try {
    await client.connect(connectOptions);
    const session = await client.openSession();

    const queryOperation = await session.executeStatement(query, queryOptions);
    const result = await queryOperation.fetchAll();

    await queryOperation.close();
    await session.close();
    await client.close();

    return result;
  } catch (error) {
    await client.close();
    if (error instanceof Error) {
      throw new Error("Error executing query on Databricks: " + error.message);
    }
  }
}
