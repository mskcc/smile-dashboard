# SMILE Dashboard - AI Agent Instructions

## Architecture Overview

SMILE Dashboard is a **full-stack TypeScript monorepo** with a React frontend and GraphQL backend:
- **Frontend** ([frontend/](frontend/)): React 17 + AG Grid + Apollo Client, serves on `localhost:3006`
- **Backend** ([graphql-server/](graphql-server/)): Apollo GraphQL server + Neo4j OGM, serves on `localhost:4000`
- **GraphQL Operations** ([graphql/](graphql/)): Shared query/mutation definitions, code-generated via `graphql-codegen`

The backend connects to **Neo4j** (primary database) and **Databricks** (for secondary queries). Data flows: Neo4j → GraphQL Schema → Apollo Cache → AG Grid Tables.

## Key Technologies & Patterns

### Backend Architecture (`graphql-server/`)
- **Schema Generation**: Neo4j introspection + custom schemas merged via `@graphql-tools/schema`
- **Data Access**: Neo4j OGM for queries, Databricks SDK for external analytics
- **Middleware Stack**: Express → Keycloak auth → Session management → Routes → Apollo
- **Caching**: Node-cache with TTLs (1-hour blocks of 500 records for client-side pagination)

**Important Pattern**: Query builders live in [graphql-server/src/schemas/queries/](graphql-server/src/schemas/queries/) (e.g., `samples.ts`, `patients.ts`). They export `queryDashboard*` functions, `buildQueryBody`, and Cypher builders consumed by cache.

### Frontend Data Fetching ([frontend/src/hooks/useFetchData.ts](frontend/src/hooks/useFetchData.ts))
- **Server-side pagination** via AG Grid's `IServerSideDatasource`: lazy-loaded in 500-record blocks
- **Dynamic filtering/sorting**: Passed as GraphQL variables, NOT query rewrites
- **PHI toggle**: Global context controls whether sensitive columns render (no data masking—visibility only)

### Code Generation
Run `yarn codegen` to regenerate types from GraphQL schema into `**/generated/graphql.ts`. **Always commit generated files**. Backend must be running for schema introspection to work.

## Development Workflows

### Setup & Local Development
```bash
# Root: Install all workspaces
yarn

# Backend setup
export NODE_TLS_REJECT_UNAUTHORIZED=0
export SMILE_CONFIG_HOME=[config dir] SMILE_DATA_HOME=[data dir]
cd graphql-server && cp src/env/application.properties.EXAMPLE src/env/application.properties
# Edit application.properties with Neo4j and Databricks credentials

# Frontend setup
cd frontend && cp .env.example .env
# Update URLs if using HTTPS certificates

# Run both
yarn dev:backend  # Terminal 1, localhost:4000
yarn dev:frontend # Terminal 2, localhost:3006
```

### Build & Deployment
- **Backend compile**: `yarn build:backend` → `graphql-server/dist`
- **Frontend build**: `yarn build` (from frontend/) → static assets
- **Docker images**: `Dockerfile` (frontend) and `graphql-server/Dockerfile`
- **Pre-commit hook**: Auto-formats changed files via Prettier

## Critical Patterns

### Query Symmetry
Requests, Patients, Samples, Cohorts pages share identical query/filter architecture. When adding features:
1. Extend Neo4j schema or Cypher queries in [graphql-server/src/schemas/queries/](graphql-server/src/schemas/queries/)
2. Regenerate GraphQL types (`yarn codegen`)
3. Extend filter config in [frontend/src/pages/*/config.tsx](frontend/src/pages/) (defines column names, filter types)
4. Update `useFetchData` hook only if introducing new variable structures

### PHI and Record Contexts
- **PHI fields** (e.g., patient ID, MRN) render conditionally via `PhiEnabledContext` + column visibility toggles
- **Record Contexts** filter by `genePanel`, `baitSet`, etc.—defined as arrays in cache constants (e.g., `WES_SAMPLE_CONTEXT`), passed to queries
- **Never mask PHI data**—only control visibility via React conditional rendering

### Session & Authentication
- Keycloak integration in [graphql-server/src/middlewares/configureSession.ts](graphql-server/src/middlewares/configureSession.ts)
- User email/groups extracted from JWT token, attached to GraphQL context
- OpenID client auto-handles token refresh

## Common Development Tasks

- **Add a new column**: Update Neo4j properties → codegen → add to page config → extend filter builder if searchable
- **Fix a data type**: Edit `graphql-server/src/schemas/custom.ts` or Neo4j schema → update `graphql/operations.graphql` → update `graphql-server/src/utils/typeDefs.ts` → `yarn codegen` → update frontend types
- **Optimize slow queries**: Profile via Neo4j Browser, add indexes, adjust `CACHE_BLOCK_SIZE` (currently 500) if needed
- **Debug AG Grid rendering**: Check `frontend/src/configs/gridIcons.tsx` for cell component overrides, verify column definitions in page config

## File Organization Reference

- **Backend queries**: `graphql-server/src/schemas/queries/{samples,patients,requests,cohorts}.ts`
- **Frontend pages**: `frontend/src/pages/{requests,patients,samples,cohorts}/`
- **Shared GraphQL operations**: `graphql/operations.graphql`
- **Utility libraries**: Backend utilities in `graphql-server/src/utils/`, frontend in `frontend/src/utils/`

## Performance Notes

- Client-side pagination block size: 500 records (hardcoded in cache + frontend config—keep in sync)
- Cache TTL: 1 hour for most data, 1 day for OncoTree + demographics
- Frontend caches GraphQL responses via Apollo's in-memory cache; no explicit eviction needed
