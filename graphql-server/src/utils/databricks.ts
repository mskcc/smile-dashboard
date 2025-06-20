import { props } from "../utils/constants";
import { DBSQLClient } from "@databricks/sql";
import IDBSQLSession from "@databricks/sql/dist/contracts/IDBSQLSession";
import IOperation from "@databricks/sql/dist/contracts/IOperation";

const { databricks_server_hostname, databricks_http_path, databricks_token } =
  props;
if (!databricks_server_hostname || !databricks_http_path || !databricks_token) {
  throw new Error(
    "Cannot find Databricks environment variables for " +
      "Server Hostname, HTTP Path, or personal access token."
  );
}

// TODO: connect GraphQL server to the CRDB table in Databricks and query from there
// Location: src_crdb_prod.crdb.crdb_cmo_loj_dmp_map
// See https://docs.databricks.com/aws/en/dev-tools/nodejs-sql-driver?language=TypeScript#query-data
export async function queryDatabricks(query: string) {
  const client = new DBSQLClient();
  const connectOptions = {
    host: databricks_server_hostname,
    path: databricks_http_path,
    token: databricks_token,
    userAgentEntry: "smile-dashboard", // for usage tracking
  };

  try {
    await client.connect(connectOptions);

    const session: IDBSQLSession = await client.openSession();
    const queryOperation: IOperation = await session.executeStatement(query, {
      runAsync: true,
    });
    const result = await queryOperation.fetchAll();

    await queryOperation.close();
    await session.close();
    await client.close();

    console.table(result);
    return result;
  } catch (error) {
    await client.close();
    throw error;
  }
}
