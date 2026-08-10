import path from "path";
const PropertiesReader = require("properties-reader");
const properties = new PropertiesReader(
  path.resolve(`${__dirname}`, "../env/application.properties")
);

// Resolves cert/key paths against SMILE_CONFIG_HOME so that relative paths in
// application.properties work regardless of the process's current working
// directory. Absolute paths are returned unchanged.
function resolveConfigPath(configPath: string): string {
  if (!configPath) return configPath;
  return path.resolve(process.env.SMILE_CONFIG_HOME || "", configPath);
}

// Resolves paths against SMILE_DATA_HOME so that relative paths in
// application.properties work regardless of the process's current working
// directory. Absolute paths are returned unchanged.
function resolveDataPath(dataPath: string): string {
  if (!dataPath) return dataPath;
  return path.resolve(process.env.SMILE_DATA_HOME || "", dataPath);
}

export const props = {
  nats_username: properties.get("conn.nats_username"),
  nats_password: properties.get("conn.nats_password"),
  nats_key_pem: resolveConfigPath(properties.get("conn.nats_key_pem")),
  nats_cert_pem: resolveConfigPath(properties.get("conn.nats_cert_pem")),
  nats_ca_pem: resolveConfigPath(properties.get("conn.nats_ca_pem")),
  nats_url: properties.get("conn.nats_url"),

  neo4j_graphql_uri: properties.get("db.neo4j_graphql_uri"),
  neo4j_username: properties.get("db.neo4j_username"),
  neo4j_password: properties.get("db.neo4j_password"),

  smile_sample_endpoint: properties.get("smile.smile_sample_endpoint"),

  pub_validate_sample_update: properties.get(
    "topics.pub_validate_igo_sample_update"
  ),
  pub_tempo_sample_billing: properties.get("topics.pub_tempo_sample_billing"),
  pub_dbgap_sample_update: properties.get("topics.pub_dbgap_sample_update"),
  pub_tempo_cohort_update: properties.get("topics.pub_tempo_cohort_update"),
  pub_tempo_new_cohort_submit: properties.get(
    "topics.pub_tempo_new_cohort_submit"
  ),
  pub_tempo_provisional_cohort: properties.get(
    "topics.pub_tempo_provisional_cohort"
  ),

  keycloak_client_id: properties.get("auth.keycloak_client_id"),
  keycloak_client_secret: properties.get("auth.keycloak_client_secret"),
  keycloak_server_uri: properties.get("auth.keycloak_server_uri"),
  express_session_secret: properties.get("auth.express_session_secret"),

  log_dir: resolveDataPath(properties.get("log.log_dir")),

  web_key_pem: resolveConfigPath(properties.get("web.web_key_pem")),
  web_cert_pem: resolveConfigPath(properties.get("web.web_cert_pem")),

  oncotree_api: properties.get("oncotree.oncotree_api"),

  databricks_server_hostname: properties.get(
    "databricks.databricks_server_hostname"
  ),
  databricks_http_path: properties.get("databricks.databricks_http_path"),
  databricks_token: properties.get("databricks.databricks_token"),
  databricks_phi_id_mapping_table: properties.get(
    "databricks.databricks_phi_id_mapping_table"
  ),
  databricks_seq_dates_by_patient_table: properties.get(
    "databricks.databricks_seq_dates_by_patient_table"
  ),
  databricks_seq_dates_by_sample_table: properties.get(
    "databricks.databricks_seq_dates_by_sample_table"
  ),
  databricks_cdsi_demographics_table: properties.get(
    "databricks.databricks_cdsi_demographics_table"
  ),
  databricks_phi_mol_accession_table: properties.get(
    "databricks.databricks_phi_mol_accession_table"
  ),

  ccs_blocked_cohort_ids: properties.get("ccs.blocked_cohort_ids"),
};

export const REACT_APP_EXPRESS_SERVER_ORIGIN =
  process.env.REACT_APP_EXPRESS_SERVER_ORIGIN === undefined
    ? "https://localhost:4000"
    : process.env.REACT_APP_EXPRESS_SERVER_ORIGIN;

export const REACT_APP_REACT_SERVER_ORIGIN =
  process.env.REACT_APP_REACT_SERVER_ORIGIN === undefined
    ? "https://localhost:3006"
    : process.env.REACT_APP_REACT_SERVER_ORIGIN;

export const corsOptions = {
  origin: REACT_APP_REACT_SERVER_ORIGIN,
  credentials: true,
};
