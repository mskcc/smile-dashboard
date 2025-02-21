import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerContext, neo4jDriver } from "../utils/servers";
import { CachedOncotreeData } from "../utils/oncotree";
import NodeCache from "node-cache";
import { gql } from "apollo-server";
import {
  AgGridSortDirection,
  DashboardSampleInput,
  QueryDashboardCohortsArgs,
  QueryDashboardCohortCountArgs,
  QueryDashboardPatientCountArgs,
  QueryDashboardPatientsArgs,
  QueryDashboardRequestCountArgs,
  QueryDashboardRequestsArgs,
  QueryDashboardSampleCountArgs,
  QueryDashboardSamplesArgs,
  DashboardRecordSort,
} from "../generated/graphql";
import { props } from "../utils/constants";
import { connect, headers, StringCodec } from "nats";
import { OGM } from "@neo4j/graphql-ogm";
const request = require("request-promise-native");

export async function buildCustomSchema(ogm: OGM) {
  const resolvers = {
    Query: {
      async dashboardRequests(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardRequestsArgs
      ) {
        const queryBody = buildRequestsQueryBody({ searchVals, filters });
        return await queryDashboardRequests({
          queryBody,
          sort,
          limit,
          offset,
        });
      },
      async dashboardRequestCount(
        _source: undefined,
        { searchVals, filters }: QueryDashboardRequestCountArgs
      ) {
        const queryBody = buildRequestsQueryBody({ searchVals, filters });
        return await queryDashboardRequestCount({ queryBody });
      },

      async dashboardPatients(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardPatientsArgs
      ) {
        const queryBody = buildPatientsQueryBody({ searchVals, filters });
        return await queryDashboardPatients({
          queryBody,
          sort,
          limit,
          offset,
        });
      },
      async dashboardPatientCount(
        _source: undefined,
        { searchVals, filters }: QueryDashboardPatientCountArgs
      ) {
        const queryBody = buildPatientsQueryBody({ searchVals, filters });
        return await queryDashboardPatientCount({ queryBody });
      },

      async dashboardCohorts(
        _source: undefined,
        { searchVals, filters, sort, limit, offset }: QueryDashboardCohortsArgs
      ) {
        const queryBody = buildCohortsQueryBody({ searchVals, filters });
        return await queryDashboardCohorts({
          queryBody,
          sort,
          limit,
          offset,
        });
      },
      async dashboardCohortCount(
        _source: undefined,
        { searchVals, filters }: QueryDashboardCohortCountArgs
      ) {
        const queryBody = buildCohortsQueryBody({ searchVals, filters });
        return await queryDashboardCohortCount({ queryBody });
      },

      async dashboardSamples(
        _source: undefined,
        {
          searchVals,
          context,
          sort,
          filters,
          limit,
          offset,
        }: QueryDashboardSamplesArgs,
        { oncotreeCache }: ApolloServerContext
      ) {
        const addlOncotreeCodes = getAddlOtCodesMatchingCtOrCtdVals({
          searchVals,
          oncotreeCache,
        });

        const queryBody = buildSamplesQueryBody({
          searchVals,
          context,
          filters,
          addlOncotreeCodes,
        });

        return await queryDashboardSamples({
          queryBody,
          sort,
          limit,
          offset,
          oncotreeCache,
        });
      },
      async dashboardSampleCount(
        _source: undefined,
        { searchVals, context, filters }: QueryDashboardSampleCountArgs,
        { oncotreeCache }: ApolloServerContext
      ) {
        const addlOncotreeCodes = getAddlOtCodesMatchingCtOrCtdVals({
          searchVals,
          oncotreeCache,
        });

        const queryBody = buildSamplesQueryBody({
          searchVals,
          context,
          filters,
          addlOncotreeCodes,
        });

        return await queryDashboardSampleCount({
          queryBody,
        });
      },
    },

    Mutation: {
      async updateDashboardSamples(
        _source: undefined,
        { newDashboardSamples }: { newDashboardSamples: DashboardSampleInput[] }
      ) {
        updateAllSamplesConcurrently(newDashboardSamples, ogm);

        // Here, we're returning newDashboardSamples for simplicity. However, if we were to follow
        // GraphQL's convention, we'd return the actual resulting data from the database update. This
        // means we'd wait for SMILE services to finish processing the data changes, then query that
        // data to return it to the frontend. For more context, see:
        // https://www.apollographql.com/docs/react/performance/optimistic-ui/#optimistic-mutation-lifecycle
        return newDashboardSamples;
      },
    },
  };

  const typeDefs = gql`
    type DashboardRequest {
      igoRequestId: String!
      igoProjectId: String
      importDate: String
      totalSampleCount: Int
      projectManagerName: String
      investigatorName: String
      investigatorEmail: String
      piEmail: String
      dataAnalystName: String
      dataAnalystEmail: String
      genePanel: String
      labHeadName: String
      labHeadEmail: String
      qcAccessEmails: String
      dataAccessEmails: String
      bicAnalysis: Boolean
      isCmoRequest: Boolean
      otherContactEmails: String
    }

    type DashboardPatient {
      smilePatientId: String!
      cmoPatientId: String
      dmpPatientId: String
      totalSampleCount: Int
      cmoSampleIds: String
      consentPartA: String
      consentPartC: String
    }

    type DashboardCohort {
      cohortId: String!
      totalSampleCount: Int
      billed: String
      initialCohortDeliveryDate: String
      endUsers: String
      pmUsers: String
      projectTitle: String
      projectSubtitle: String
      status: String
      type: String
    }

    type DashboardSample {
      # (s:Sample)
      smileSampleId: String!
      revisable: Boolean

      # (s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
      ## Root-level fields
      primaryId: String!
      cmoSampleName: String
      importDate: String!
      cmoPatientId: String
      investigatorSampleId: String
      sampleType: String
      species: String
      genePanel: String
      baitSet: String
      preservation: String
      tumorOrNormal: String
      sampleClass: String
      oncotreeCode: String
      collectionYear: String
      sampleOrigin: String
      tissueLocation: String
      sex: String
      ## Custom fields
      recipe: String
      altId: String
      historicalCmoSampleNames: String
      ## (sm:SampleMetadata)-[:HAS_STATUS]->(s:Status)
      validationReport: String
      validationStatus: Boolean

      # Oncotree API
      cancerType: String
      cancerTypeDetailed: String

      ## (s:Sample)-[:HAS_TEMPO]->(t:Tempo)
      ## Root-level fields
      billed: Boolean
      costCenter: String
      billedBy: String
      custodianInformation: String
      accessLevel: String
      ## Custom fields
      initialPipelineRunDate: String
      embargoDate: String
      ## (t:Tempo)-[:HAS_EVENT]->(bc:BamComplete)
      bamCompleteDate: String
      bamCompleteStatus: String
      ## (t:Tempo)-[:HAS_EVENT]->(mc:MafComplete)
      mafCompleteDate: String
      mafCompleteNormalPrimaryId: String
      mafCompleteStatus: String
      # (t:Tempo)-[:HAS_EVENT]->(qc:QcComplete)
      qcCompleteDate: String
      qcCompleteResult: String
      qcCompleteReason: String
      qcCompleteStatus: String
    }

    enum AgGridSortDirection {
      asc
      desc
    }

    type DashboardRecordCount {
      totalCount: Int!
      uniqueSampleCount: Int
    }

    input DashboardRecordContext {
      fieldName: String
      values: [String!]!
    }

    # Modeling after AG Grid's SortModel type
    input DashboardRecordSort {
      colId: String! # field name
      sort: AgGridSortDirection!
    }

    input DashboardRecordFilter {
      field: String!
      filter: String!
    }

    type Query {
      dashboardRequests(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
        sort: DashboardRecordSort!
        limit: Int!
        offset: Int!
      ): [DashboardRequest!]!
      dashboardRequestCount(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
      ): DashboardRecordCount!

      dashboardPatients(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
        sort: DashboardRecordSort!
        limit: Int!
        offset: Int!
      ): [DashboardPatient!]!
      dashboardPatientCount(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
      ): DashboardRecordCount!

      dashboardCohorts(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
        sort: DashboardRecordSort!
        limit: Int!
        offset: Int!
      ): [DashboardCohort!]!
      dashboardCohortCount(
        searchVals: [String!]
        filters: [DashboardRecordFilter!]
      ): DashboardRecordCount!

      dashboardSamples(
        searchVals: [String!]
        context: DashboardRecordContext
        filters: [DashboardRecordFilter!]
        sort: DashboardRecordSort!
        limit: Int!
        offset: Int!
      ): [DashboardSample!]!
      dashboardSampleCount(
        searchVals: [String!]
        context: DashboardRecordContext
        filters: [DashboardRecordFilter!]
      ): DashboardRecordCount!
    }

    # We have to define a separate "input" type for the mutation and can't reuse DashboardSample.
    # For more context, see: https://stackoverflow.com/q/41743253
    input DashboardSampleInput {
      changedFieldNames: [String!]!

      # (s:Sample)
      smileSampleId: String!
      revisable: Boolean

      # (s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
      ## Root-level fields
      primaryId: String!
      cmoSampleName: String
      importDate: String!
      cmoPatientId: String
      investigatorSampleId: String
      sampleType: String
      species: String
      genePanel: String
      baitSet: String
      preservation: String
      tumorOrNormal: String
      sampleClass: String
      oncotreeCode: String
      collectionYear: String
      sampleOrigin: String
      tissueLocation: String
      sex: String
      ## Custom fields
      recipe: String
      altId: String
      historicalCmoSampleNames: String
      ## (sm:SampleMetadata)-[:HAS_STATUS]->(s:Status)
      validationReport: String
      validationStatus: Boolean

      # Oncotree API
      cancerType: String
      cancerTypeDetailed: String

      ## (s:Sample)-[:HAS_TEMPO]->(t:Tempo)
      ## Root-level fields
      billed: Boolean
      costCenter: String
      billedBy: String
      custodianInformation: String
      accessLevel: String
      ## Custom fields
      initialPipelineRunDate: String
      embargoDate: String
      ## (t:Tempo)-[:HAS_EVENT]->(bc:BamComplete)
      bamCompleteDate: String
      bamCompleteStatus: String
      ## (t:Tempo)-[:HAS_EVENT]->(mc:MafComplete)
      mafCompleteDate: String
      mafCompleteNormalPrimaryId: String
      mafCompleteStatus: String
      # (t:Tempo)-[:HAS_EVENT]->(qc:QcComplete)
      qcCompleteDate: String
      qcCompleteResult: String
      qcCompleteReason: String
      qcCompleteStatus: String
    }

    type Mutation {
      updateDashboardSamples(
        newDashboardSamples: [DashboardSampleInput]
      ): [DashboardSample]
    }
  `;

  return makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers,
  });
}

function buildRequestsQueryBody({
  searchVals,
  filters,
}: {
  searchVals: QueryDashboardRequestsArgs["searchVals"];
  filters?: QueryDashboardRequestsArgs["filters"];
}) {
  const queryFilters = [];

  if (searchVals?.length) {
    const fieldsToSearch = [
      "igoRequestId",
      "igoProjectId",
      "importDate",
      "projectManagerName",
      "investigatorName",
      "investigatorEmail",
      "piEmail",
      "dataAnalystName",
      "dataAnalystEmail",
      "genePanel",
      "labHeadName",
      "labHeadEmail",
      "qcAccessEmails",
      "dataAccessEmails",
      "bicAnalysis",
      "isCmoRequest",
      "otherContactEmails",
    ];
    const searchFilters = fieldsToSearch
      .map((field) => `${field} =~ '(?i).*(${searchVals.join("|")}).*'`)
      .join(" OR ");
    queryFilters.push(searchFilters);
  }

  if (filters) {
    const importDateFilterObj = filters?.find(
      (filter) => filter.field === "importDate"
    );
    if (importDateFilterObj) {
      const importDateFilter = buildCypherDateFilter({
        dateVar: "importDate",
        filter: JSON.parse(importDateFilterObj.filter),
      });
      queryFilters.push(importDateFilter);
    }

    const bicAnalysisFilterObj = filters?.find(
      (filter) => filter.field === "bicAnalysis"
    );
    if (bicAnalysisFilterObj) {
      const bicAnalysisFilter = buildCypherBooleanFilter({
        booleanVar: "bicAnalysis",
        filter: JSON.parse(bicAnalysisFilterObj.filter),
        noIncludesFalseAndNull: true,
      });
      queryFilters.push(bicAnalysisFilter);
    }

    const cmoRequestFilterObj = filters?.find(
      (filter) => filter.field === "isCmoRequest"
    );
    if (cmoRequestFilterObj) {
      const cmoRequestFilter = buildCypherBooleanFilter({
        booleanVar: "isCmoRequest",
        filter: JSON.parse(cmoRequestFilterObj.filter),
        noIncludesFalseAndNull: true,
      });
      queryFilters.push(cmoRequestFilter);
    }
  }

  const filtersAsCypher = buildFinalCypherFilter({ queryFilters });

  const requestsQueryBody = `
    MATCH (r:Request)

    // Get the latest SampleMetadata of each Sample
    OPTIONAL MATCH (r)-[:HAS_SAMPLE]->(s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
    WITH
      r,
      count(DISTINCT s.smileSampleId) AS totalSampleCount,
      collect(sm) AS allSampleMetadata,
      max(sm.importDate) AS latestImportDate
    WITH
      r,
      totalSampleCount,
      [sm IN allSampleMetadata WHERE sm.importDate = latestImportDate][0] AS latestSm

    WITH
      r.igoRequestId AS igoRequestId,
      r.igoProjectId AS igoProjectId,
      latestSm.importDate AS importDate,
      totalSampleCount,
      r.projectManagerName AS projectManagerName,
      r.investigatorName AS investigatorName,
      r.investigatorEmail AS investigatorEmail,
      r.piEmail AS piEmail,
      r.dataAnalystName AS dataAnalystName,
      r.dataAnalystEmail AS dataAnalystEmail,
      r.genePanel AS genePanel,
      r.labHeadName AS labHeadName,
      r.labHeadEmail AS labHeadEmail,
      r.qcAccessEmails AS qcAccessEmails,
      r.dataAccessEmails AS dataAccessEmails,
      r.bicAnalysis AS bicAnalysis,
      r.isCmoRequest AS isCmoRequest,
      r.otherContactEmails AS otherContactEmails

    ${filtersAsCypher}
  `;

  return requestsQueryBody;
}

async function queryDashboardRequests({
  queryBody,
  sort,
  limit,
  offset,
}: {
  queryBody: string;
  sort: QueryDashboardRequestsArgs["sort"];
  limit: QueryDashboardRequestsArgs["limit"];
  offset: QueryDashboardRequestsArgs["offset"];
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      igoRequestId,
      igoProjectId,
      importDate,
      totalSampleCount,
      projectManagerName,
      investigatorName,
      investigatorEmail,
      piEmail,
      dataAnalystName,
      dataAnalystEmail,
      genePanel,
      labHeadName,
      labHeadEmail,
      qcAccessEmails,
      dataAccessEmails,
      bicAnalysis,
      isCmoRequest,
      otherContactEmails
    ORDER BY ${getNeo4jCustomSort(sort)}
    SKIP ${offset}
    LIMIT ${limit}
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records.map((record) => record.toObject());
  } catch (error) {
    console.error("Error with queryDashboardRequests:", error);
  }
}

async function queryDashboardRequestCount({
  queryBody,
}: {
  queryBody: string;
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN count(igoRequestId) AS totalCount
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records[0].toObject();
  } catch (error) {
    console.error("Error with queryDashboardRequestCount:", error);
  }
}

function buildPatientsQueryBody({
  searchVals,
  filters,
}: {
  searchVals: QueryDashboardPatientsArgs["searchVals"];
  filters?: QueryDashboardPatientsArgs["filters"];
}) {
  const queryFilters = [];

  if (searchVals?.length) {
    const fieldsToSearch = [
      "smilePatientId",
      "cmoPatientId",
      "dmpPatientId",
      "cmoSampleIds",
      "consentPartA",
      "consentPartC",
    ];
    const searchFilters = fieldsToSearch
      .map((field) => `${field} =~ '(?i).*(${searchVals.join("|")}).*'`)
      .join(" OR ");
    queryFilters.push(searchFilters);
  }

  if (filters) {
    const consentPartAFilterObj = filters?.find(
      (filter) => filter.field === "consentPartA"
    );
    if (consentPartAFilterObj) {
      const consentPartAFilter = buildCypherBooleanFilter({
        booleanVar: "consentPartA",
        filter: JSON.parse(consentPartAFilterObj.filter),
        trueVal: "YES",
        falseVal: "NO",
      });
      queryFilters.push(consentPartAFilter);
    }

    const consentPartCFilterObj = filters?.find(
      (filter) => filter.field === "consentPartC"
    );
    if (consentPartCFilterObj) {
      const consentPartCFilter = buildCypherBooleanFilter({
        booleanVar: "consentPartC",
        filter: JSON.parse(consentPartCFilterObj.filter),
        trueVal: "YES",
        falseVal: "NO",
      });
      queryFilters.push(consentPartCFilter);
    }
  }

  const filtersAsCypher = buildFinalCypherFilter({ queryFilters });

  const patientsQueryBody = `
    MATCH (p:Patient)

    // Get patient aliases
    OPTIONAL MATCH (p)<-[:IS_ALIAS]-(cmoPa:PatientAlias {namespace: 'cmoId'})
    OPTIONAL MATCH (p)<-[:IS_ALIAS]-(dmpPa:PatientAlias {namespace: 'dmpId'})

    // Get the latest SampleMetadata of each Sample
    OPTIONAL MATCH (p)-[:HAS_SAMPLE]->(s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
    WITH
      p,
      cmoPa,
      dmpPa,
      s,
      collect(sm) AS allSampleMetadata,
      max(sm.importDate) AS latestImportDate
    WITH
      p,
      cmoPa,
      dmpPa,
      s,
      latestImportDate,
      [sm IN allSampleMetadata WHERE sm.importDate = latestImportDate][0] AS latestSm

    // Get the CMO Sample IDs and additionalProperties JSONs from SampleMetadata
    WITH
      p,
      cmoPa,
      dmpPa,
      s,
      latestImportDate,
      CASE
        WHEN latestSm.cmoSampleName IS NOT NULL THEN latestSm.cmoSampleName
            ELSE latestSm.primaryId
        END AS cmoSampleId,
      apoc.convert.fromJsonMap(latestSm.additionalProperties) AS latestSmAddlPropsJson

    // Implode/aggregate the different arrays
    WITH
      p,
      cmoPa,
      dmpPa,
      max(latestImportDate) AS latestImportDate,
      collect(s) AS samples,
      collect(cmoSampleId) AS cmoSampleIds,
      collect(latestSmAddlPropsJson.\`consent-parta\`) AS consentPartAs,
      collect(latestSmAddlPropsJson.\`consent-partc\`) AS consentPartCs

    WITH
      p.smilePatientId AS smilePatientId,
      cmoPa.value AS cmoPatientId,
      dmpPa.value AS dmpPatientId,
      latestImportDate,
      size(samples) AS totalSampleCount,
      apoc.text.join([id IN cmoSampleIds WHERE id <> ''], ', ') AS cmoSampleIds,
      consentPartAs[0] AS consentPartA,
      consentPartCs[0] AS consentPartC

    ${filtersAsCypher}
  `;

  return patientsQueryBody;
}

async function queryDashboardPatients({
  queryBody,
  sort,
  limit,
  offset,
}: {
  queryBody: string;
  sort: QueryDashboardPatientsArgs["sort"];
  limit: QueryDashboardPatientsArgs["limit"];
  offset: QueryDashboardPatientsArgs["offset"];
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      smilePatientId,
      cmoPatientId,
      dmpPatientId,
      totalSampleCount,
      cmoSampleIds,
      consentPartA,
      consentPartC
    ORDER BY ${getNeo4jCustomSort(sort)}
    SKIP ${offset}
    LIMIT ${limit}
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records.map((record) => record.toObject());
  } catch (error) {
    console.error("Error with queryDashboardPatients:", error);
  }
}

async function queryDashboardPatientCount({
  queryBody,
}: {
  queryBody: string;
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN count(smilePatientId) AS totalCount
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records[0].toObject();
  } catch (error) {
    console.error("Error with queryDashboardPatientCount:", error);
  }
}

function buildCohortsQueryBody({
  searchVals,
  filters,
}: {
  searchVals: QueryDashboardCohortsArgs["searchVals"];
  filters?: QueryDashboardCohortsArgs["filters"];
}) {
  const queryFilters = [];

  if (searchVals?.length) {
    const fieldsToSearch = [
      "cohortId",
      "billed",
      "initialCohortDeliveryDate",
      "endUsers",
      "pmUsers",
      "projectTitle",
      "projectSubtitle",
      "status",
      "type",
    ];
    const searchFilters = fieldsToSearch
      .map((field) => `${field} =~ '(?i).*(${searchVals.join("|")}).*'`)
      .join(" OR ");
    queryFilters.push(searchFilters);
  }

  if (filters) {
    const billedFilterObj = filters?.find(
      (filter) => filter.field === "billed"
    );
    if (billedFilterObj) {
      const billedFilter = buildCypherBooleanFilter({
        booleanVar: "billed",
        filter: JSON.parse(billedFilterObj.filter),
        trueVal: "Yes",
        falseVal: "No",
      });
      queryFilters.push(billedFilter);
    }

    const initialCohortDeliveryDateFilterObj = filters?.find(
      (filter) => filter.field === "initialCohortDeliveryDate"
    );
    if (initialCohortDeliveryDateFilterObj) {
      const initialCohortDeliveryDateFilter = buildCypherDateFilter({
        dateVar: "initialCohortDeliveryDate",
        filter: JSON.parse(initialCohortDeliveryDateFilterObj.filter),
      });
      queryFilters.push(initialCohortDeliveryDateFilter);
    }
  }

  const filtersAsCypher = buildFinalCypherFilter({ queryFilters });

  const cohortsQueryBody = `
    MATCH (c:Cohort)-[:HAS_COHORT_COMPLETE]->(cc:CohortComplete)
    OPTIONAL MATCH (c)-[:HAS_COHORT_SAMPLE]->(s:Sample)-[:HAS_TEMPO]->(t:Tempo)

    // Aggregate Tempo and CohortComplete data
    WITH
        c.cohortId AS cohortId,
        s,
        count(t) AS tempoCount,
        count(CASE WHEN t.billed = true THEN 1 END) AS billedCount,
        collect(cc) AS cohortCompletes,
        max(cc.date) AS latestCohortDeliveryDate,
        min(cc.date) AS initialCohortDeliveryDate

    // Aggregate Sample data and get the latest CohortComplete
    WITH
        collect(s.smileSampleId) AS sampleIdsByCohort,
        cohortId,
        size(collect(s)) AS totalSampleCount,
        tempoCount,
        billedCount,
        initialCohortDeliveryDate,
        [cc IN cohortCompletes WHERE cc.date = latestCohortDeliveryDate][0] AS latestCC

    // Calculate values for the "Billed" column
    WITH
        sampleIdsByCohort,
        cohortId,
        totalSampleCount,
        CASE totalSampleCount
            WHEN 0 THEN "Yes"
            ELSE
                CASE (billedCount = tempoCount)
                    WHEN true THEN "Yes"
                    ELSE "No"
                END
        END AS billed,
        initialCohortDeliveryDate,
        latestCC

    WITH
        sampleIdsByCohort,
        cohortId,
        totalSampleCount,
        billed,
        initialCohortDeliveryDate,
        latestCC.endUsers AS endUsers,
        latestCC.pmUsers AS pmUsers,
        latestCC.projectTitle AS projectTitle,
        latestCC.projectSubtitle AS projectSubtitle,
        latestCC.status AS status,
        latestCC.type AS type

    ${filtersAsCypher}
  `;

  return cohortsQueryBody;
}

async function queryDashboardCohorts({
  queryBody,
  sort,
  limit,
  offset,
}: {
  queryBody: string;
  sort: QueryDashboardPatientsArgs["sort"];
  limit: QueryDashboardPatientsArgs["limit"];
  offset: QueryDashboardPatientsArgs["offset"];
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      cohortId,
      totalSampleCount,
      billed,
      initialCohortDeliveryDate,
      endUsers,
      pmUsers,
      projectTitle,
      projectSubtitle,
      status,
      type

    ORDER BY ${getNeo4jCustomSort(sort)}
    SKIP ${offset}
    LIMIT ${limit}
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records.map((record) => record.toObject());
  } catch (error) {
    console.error("Error with queryDashboardCohorts:", error);
  }
}

async function queryDashboardCohortCount({ queryBody }: { queryBody: string }) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      count(cohortId) AS totalCount,
      size(apoc.coll.toSet(apoc.coll.flatten(collect(sampleIdsByCohort)))) AS uniqueSampleCount
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records[0].toObject();
  } catch (error) {
    console.error("Error with queryDashboardCohortCount:", error);
  }
}

/**
 * Build "from" and "to" date predicates to be used in a WHERE clause in Cypher.
 *
 * This function can also handle unsafe date values like Tempo event dates, which can come in a variety of formats
 * such as date values in "yyyy-MM-dd" or "yyyy-MM-dd HH:mm" or "yyyy-MM-dd HH:mm:ss.SSSSSS", empty strings, or "FAILED".
 *
 * @param dateVar The date variable in the current Cypher context e.g. `bc.date` from `MATCH (bc:BamComplete) RETURN bc.date`
 * @param filter The filter object type from AG Grid's `agDateColumnFilter`
 * @param safelyHandleDateString Set this to true when working with date values that are unpredictable/non-standardized
 *
 */
function buildCypherDateFilter({
  dateVar,
  filter,
  safelyHandleDateString = false,
}: {
  dateVar: string;
  safelyHandleDateString?: boolean;
  filter: {
    dateFrom: string;
    dateTo: string;
  };
}) {
  const formattedDateString = safelyHandleDateString
    ? `
    CASE
      WHEN size(${dateVar}) >= 10 THEN left(${dateVar}, 10) // trims date formats more granular than yyyy-MM-dd
      ELSE '1900-01-01' // excludes record from the result
    END`
    : dateVar;

  return `
      apoc.date.parse(${formattedDateString}, 'ms', 'yyyy-MM-dd')
        >= apoc.date.parse('${filter.dateFrom}', 'ms', 'yyyy-MM-dd HH:mm:ss') // AG Grid's provided date format
      AND apoc.date.parse(${formattedDateString}, 'ms', 'yyyy-MM-dd')
        <= apoc.date.parse('${filter.dateTo}', 'ms', 'yyyy-MM-dd HH:mm:ss')
    `;
}

/**
 * Build boolean predicates to be used in a WHERE clause in Cypher.
 *
 * @param booleanVar The boolean variable in the current Cypher context e.g. `t.billed` from `MATCH (t:Tempo) RETURN t.billed`
 * @param filter The filter object type from AG Grid's `agSetColumnFilter`
 * @param noIncludesFalseAndNull Set this to true if we want the user's filter selection of "No" to include both false and null values
 * @param trueVal The true value that appears in the database for a given field (e.g. "Yes", true)
 * @param falseVal The false value that appears in the database for a given field (e.g. "No", false)
 *
 */
function buildCypherBooleanFilter({
  booleanVar,
  filter,
  noIncludesFalseAndNull = false,
  trueVal = true,
  falseVal = false,
}: {
  booleanVar: string;
  filter: {
    values: string[];
  };
  noIncludesFalseAndNull?: boolean;
  trueVal?: string | boolean;
  falseVal?: string | boolean;
}) {
  const formattedTrueVal =
    typeof trueVal === "string" ? `'${trueVal}'` : trueVal;
  const formattedFalseVal =
    typeof falseVal === "string" ? `'${falseVal}'` : falseVal;

  const filterValues = filter.values;
  if (filterValues?.length > 0) {
    const activeFilters = [];
    for (const value of filterValues) {
      if (value === "Yes") {
        activeFilters.push(`${booleanVar} = ${formattedTrueVal}`);
      } else if (value === "No") {
        if (!noIncludesFalseAndNull) {
          activeFilters.push(`${booleanVar} = ${formattedFalseVal}`);
        } else {
          activeFilters.push(
            `${booleanVar} = ${formattedFalseVal} OR ${booleanVar} IS NULL`
          );
        }
      } else if (value === null) {
        activeFilters.push(`${booleanVar} IS NULL`);
      }
    }
    return activeFilters.join(" OR ");
  } else {
    return `${booleanVar} <> ${formattedTrueVal} AND ${booleanVar} <> ${formattedFalseVal} AND ${booleanVar} IS NOT NULL`;
  }
}

function buildFinalCypherFilter({ queryFilters }: { queryFilters: string[] }) {
  const combinedPredicates = queryFilters
    .filter(Boolean)
    .map((queryFilter) => `(${queryFilter})`)
    .join(" AND ");

  return combinedPredicates ? "WHERE " + combinedPredicates : "";
}

function buildSamplesQueryBody({
  searchVals,
  context,
  filters,
  addlOncotreeCodes,
}: {
  searchVals: QueryDashboardSampleCountArgs["searchVals"];
  context?: QueryDashboardSampleCountArgs["context"];
  filters?: QueryDashboardSamplesArgs["filters"];
  addlOncotreeCodes: string[];
}) {
  // Because the samples query is more complex than other queries (e.g. requests), we improve its performance
  // by building WHERE clauses and injecting them into the query as early as possible and when convenient.
  // This contrasts with our approach in other query builders, where we combine all predicates into a single
  // WHERE clause and injecting that at the end (right before the RETURN statement).

  let searchFilters = "";
  if (searchVals?.length) {
    const fieldsToSearch = [
      "latestSm.primaryId",
      "latestSm.cmoSampleName",
      "latestSm.importDate",
      "latestSm.cmoPatientId",
      "latestSm.investigatorSampleId",
      "latestSm.sampleType",
      "latestSm.species",
      "latestSm.genePanel",
      "latestSm.baitSet",
      "latestSm.preservation",
      "latestSm.tumorOrNormal",
      "latestSm.sampleClass",
      "latestSm.oncotreeCode",
      "latestSm.collectionYear",
      "latestSm.sampleOrigin",
      "latestSm.tissueLocation",
      "latestSm.sex",
      "latestSm.cmoSampleIdFields", // for searching recipe
      "latestSm.additionalProperties", // for searching alt ID
      "t.costCenter",
      "t.billedBy",
      "t.custodianInformation",
      "t.accessLevel",
      "latestBC.date",
      "latestBC.status",
      "latestMC.date",
      "latestMC.normalPrimaryId",
      "latestMC.status",
      "latestQC.date",
      "latestQC.result",
      "latestQC.reason",
      "latestQC.status",
      "historicalCmoSampleNames",
    ];
    searchFilters += fieldsToSearch
      .map((field) => `${field} =~ '(?i).*(${searchVals.join("|")}).*'`)
      .join(" OR ");
    if (addlOncotreeCodes.length) {
      searchFilters += ` OR latestSm.oncotreeCode =~ '^(${addlOncotreeCodes.join(
        "|"
      )})'`;
    }
  }

  // Filter for WES samples on click on the Samples page
  const wesContext =
    context?.fieldName === "genePanel"
      ? `latestSm.genePanel =~ '(?i).*(${context.values.join("|")}).*'`
      : "";

  // Filter for the current request in the Request Samples view
  const requestContext =
    context?.fieldName === "igoRequestId"
      ? `latestSm.igoRequestId = '${context.values[0]}'`
      : "";

  // Filter for the current patient for the Patient Samples view
  const patientContext =
    context?.fieldName === "patientId"
      ? `pa.value = '${context.values[0]}'`
      : "";

  // Filter for the current cohort for the Cohort Samples view
  const cohortContext =
    context?.fieldName === "cohortId"
      ? `c.cohortId = '${context.values[0]}'`
      : "";

  // "Last Updated" column filter in the Samples Metadata view
  let importDateFilter = "";
  const importDateFilterObj = filters?.find(
    (filter) => filter.field === "importDate"
  );
  if (importDateFilterObj) {
    importDateFilter = buildCypherDateFilter({
      dateVar: "latestSm.importDate",
      filter: JSON.parse(importDateFilterObj.filter),
    });
  }

  // "Billed" column filter for the Cohort Samples view
  let billedFilter = "";
  const billedFilterObj = filters?.find((filter) => filter.field === "billed");
  if (billedFilterObj) {
    billedFilter = buildCypherBooleanFilter({
      booleanVar: "t.billed",
      filter: JSON.parse(billedFilterObj.filter),
      noIncludesFalseAndNull: true,
    });
  }

  // "Initial Pipeline Run Date" column filter in the Cohort Samples view
  let initialPipelineRunDateFilter = "";
  const initialPipelineRunDateFilterObj = filters?.find(
    (filter) => filter.field === "initialPipelineRunDate"
  );
  if (initialPipelineRunDateFilterObj) {
    initialPipelineRunDateFilter = buildCypherDateFilter({
      dateVar: "t.initialPipelineRunDate",
      filter: JSON.parse(initialPipelineRunDateFilterObj.filter),
    });
  }
  // Embargo Date" column filter in the Cohort Samples view
  let embargoDateFilter = "";
  const embargoDateFilterObj = filters?.find(
    (filter) => filter.field === "embargoDate"
  );
  if (embargoDateFilterObj) {
    embargoDateFilter = buildCypherDateFilter({
      dateVar: "t.embargoDate",
      filter: JSON.parse(embargoDateFilterObj.filter),
    });
  }
  const cohortDateFilters = [initialPipelineRunDateFilter, embargoDateFilter]
    .filter(Boolean)
    .map((filter) => `(${filter})`)
    .join(" AND ");

  // "Latest BAM Complete Date" column filter in the Cohort Samples view
  let bamCompleteDateFilter = "";
  const bamCompleteDateFilterObj = filters?.find(
    (filter) => filter.field === "bamCompleteDate"
  );
  if (bamCompleteDateFilterObj) {
    bamCompleteDateFilter = buildCypherDateFilter({
      dateVar: "latestBC.date",
      safelyHandleDateString: true,
      filter: JSON.parse(bamCompleteDateFilterObj.filter),
    });
  }

  // "Latest MAF Complete Date" column filter in the Cohort Samples view
  let mafCompleteDateFilter = "";
  const mafCompleteDateFilterObj = filters?.find(
    (filter) => filter.field === "mafCompleteDate"
  );
  if (mafCompleteDateFilterObj) {
    mafCompleteDateFilter = buildCypherDateFilter({
      dateVar: "latestMC.date",
      safelyHandleDateString: true,
      filter: JSON.parse(mafCompleteDateFilterObj.filter),
    });
  }

  // "Latest QC Complete Date" column filter in the Cohort Samples view
  let qcCompleteDateFilter = "";
  const qcCompleteDateFilterObj = filters?.find(
    (filter) => filter.field === "qcCompleteDate"
  );
  if (qcCompleteDateFilterObj) {
    qcCompleteDateFilter = buildCypherDateFilter({
      dateVar: "latestQC.date",
      safelyHandleDateString: true,
      filter: JSON.parse(qcCompleteDateFilterObj.filter),
    });
  }

  // NOTE: For future reference, we can get a list of historical CMO labels and import dates by replacing
  // '| sm.cmoSampleName' with '| {cmoSampleName: sm.cmoSampleName, importDate: sm.importDate}'
  const samplesQueryBody = `
    // Get Sample and the most recent SampleMetadata
    MATCH (s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
    WITH
      s,
      collect(sm) AS allSampleMetadata,
      max(sm.importDate) AS latestImportDate
    WITH
      s,
      allSampleMetadata,
      [sm IN allSampleMetadata WHERE sm.importDate = latestImportDate][0] AS latestSm

    // Get a list of historical CMO sample labels
    WITH
      s,
      latestSm,
      apoc.text.join(
        apoc.coll.toSet(
          [sm IN apoc.coll.sortMaps(allSampleMetadata, "importDate")
            WHERE sm.cmoSampleName <> latestSm.cmoSampleName AND sm.cmoSampleName <> ""
            | sm.cmoSampleName + " (" + sm.importDate + ")"
          ]
        ),
      ", ") AS historicalCmoSampleNames

    // Filters for either the WES Samples or Request Samples view, if applicable
    ${wesContext && `WHERE ${wesContext}`}
    ${requestContext && `WHERE ${requestContext}`}

    // Get SampleMetadata's Status
    OPTIONAL MATCH (latestSm)-[:HAS_STATUS]->(st:Status)
    WITH
      s,
      latestSm,
      historicalCmoSampleNames,
      st AS latestSt
    ${importDateFilter && `WHERE ${importDateFilter}`}

    // Filters for Patient Samples view, if applicable
    ${
      patientContext &&
      `MATCH (s)<-[:HAS_SAMPLE]-(p:Patient)<-[:IS_ALIAS]-(pa:PatientAlias) WHERE ${patientContext}`
    }

    // Filters for Cohort Samples view, if applicable
    ${
      cohortContext ? "" : "OPTIONAL "
    }MATCH (s)<-[:HAS_COHORT_SAMPLE]-(c:Cohort)
    ${cohortContext && `WHERE ${cohortContext}`}

    // Get Tempo data
    OPTIONAL MATCH (s)-[:HAS_TEMPO]->(t:Tempo)
    // We're calling WITH immediately after OPTIONAL MATCH here to correctly filter Tempo data
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t
    ${billedFilter && `WHERE ${billedFilter}`}
    ${cohortDateFilters && `WHERE ${cohortDateFilters}`}

    // Get the most recent BamComplete event
    OPTIONAL MATCH (t)-[:HAS_EVENT]->(bc:BamComplete)
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      collect(bc) AS allBamCompletes,
      max(bc.date) AS latestBCDate
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      [bc IN allBamCompletes WHERE bc.date = latestBCDate][0] AS latestBC
    ${bamCompleteDateFilter && `WHERE ${bamCompleteDateFilter}`}

    // Get the most recent MafComplete event
    OPTIONAL MATCH (t)-[:HAS_EVENT]->(mc:MafComplete)
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      latestBC,
      collect(mc) AS allMafCompletes,
      max(mc.date) AS latestMCDate
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      latestBC,
      [mc IN allMafCompletes WHERE mc.date = latestMCDate][0] AS latestMC
    ${mafCompleteDateFilter && `WHERE ${mafCompleteDateFilter}`}

    // Get the most recent QcComplete event
    OPTIONAL MATCH (t)-[:HAS_EVENT]->(qc:QcComplete)
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      latestBC,
      latestMC,
      collect(qc) AS allQcCompletes,
      max(qc.date) AS latestQCDate
    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      latestBC,
      latestMC,
      [qc IN allQcCompletes WHERE qc.date = latestQCDate][0] AS latestQC
    ${qcCompleteDateFilter && `WHERE ${qcCompleteDateFilter}`}

    WITH
      s,
      latestSm,
      latestSt,
      historicalCmoSampleNames,
      t,
      latestBC,
      latestMC,
      latestQC
    ${searchFilters && `WHERE ${searchFilters}`}
  `;

  return samplesQueryBody;
}

async function queryDashboardSamples({
  queryBody,
  sort,
  limit,
  offset,
  oncotreeCache,
}: {
  queryBody: string;
  sort: QueryDashboardSamplesArgs["sort"];
  limit: QueryDashboardSamplesArgs["limit"];
  offset: QueryDashboardSamplesArgs["offset"];
  oncotreeCache: NodeCache;
}) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      s.smileSampleId AS smileSampleId,
      s.revisable AS revisable,

      latestSm.primaryId AS primaryId,
      latestSm.cmoSampleName AS cmoSampleName,
      latestSm.importDate AS importDate,
      latestSm.cmoPatientId AS cmoPatientId,
      latestSm.investigatorSampleId AS investigatorSampleId,
      latestSm.sampleType AS sampleType,
      latestSm.species AS species,
      latestSm.genePanel AS genePanel,
      latestSm.baitSet AS baitSet,
      latestSm.preservation AS preservation,
      latestSm.tumorOrNormal AS tumorOrNormal,
      latestSm.sampleClass AS sampleClass,
      latestSm.oncotreeCode AS oncotreeCode,
      latestSm.collectionYear AS collectionYear,
      latestSm.sampleOrigin AS sampleOrigin,
      latestSm.tissueLocation AS tissueLocation,
      latestSm.sex AS sex,
      apoc.convert.fromJsonMap(latestSm.cmoSampleIdFields).recipe AS recipe,
      apoc.convert.fromJsonMap(latestSm.additionalProperties).altId AS altId,
      historicalCmoSampleNames,
      latestSt.validationReport AS validationReport,
      latestSt.validationStatus AS validationStatus,

      t.smileTempoId AS smileTempoId,
      t.billed AS billed,
      t.costCenter AS costCenter,
      t.billedBy AS billedBy,
      t.custodianInformation AS custodianInformation,
      t.accessLevel AS accessLevel,
      t.initialPipelineRunDate AS initialPipelineRunDate,
      t.embargoDate AS embargoDate,

      latestBC.date AS bamCompleteDate,
      latestBC.status AS bamCompleteStatus,

      latestMC.date AS mafCompleteDate,
      latestMC.normalPrimaryId AS mafCompleteNormalPrimaryId,
      latestMC.status AS mafCompleteStatus,

      latestQC.date AS qcCompleteDate,
      latestQC.result AS qcCompleteResult,
      latestQC.reason AS qcCompleteReason,
      latestQC.status AS qcCompleteStatus

    ORDER BY ${getNeo4jCustomSort(sort)}
    SKIP ${offset}
    LIMIT ${limit}
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);

    return result.records.map((record) => {
      const recordObject = record.toObject();
      const otCache = recordObject.oncotreeCode
        ? (oncotreeCache.get(recordObject.oncotreeCode) as CachedOncotreeData)
        : null;

      return {
        ...recordObject,
        cancerType: otCache?.mainType,
        cancerTypeDetailed: otCache?.name,
      };
    });
  } catch (error) {
    console.error("Error with queryDashboardSamples:", error);
  }
}

async function queryDashboardSampleCount({ queryBody }: { queryBody: string }) {
  const cypherQuery = `
    ${queryBody}
    RETURN
      count(s) AS totalCount
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records[0].toObject();
  } catch (error) {
    console.error("Error with queryDashboardSampleCount:", error);
  }
}

function getAddlOtCodesMatchingCtOrCtdVals({
  searchVals,
  oncotreeCache,
}: {
  searchVals: QueryDashboardSamplesArgs["searchVals"];
  oncotreeCache: NodeCache;
}) {
  let addlOncotreeCodes: Set<string> = new Set();
  if (searchVals?.length) {
    oncotreeCache.keys().forEach((code) => {
      const { name, mainType } = (oncotreeCache.get(
        code
      ) as CachedOncotreeData)!;
      searchVals.forEach((val) => {
        if (
          name?.toLowerCase().includes(val?.toLowerCase()) ||
          mainType?.toLowerCase().includes(val?.toLowerCase())
        ) {
          addlOncotreeCodes.add(code);
        }
      });
    });
  }
  return Array.from(addlOncotreeCodes);
}

/**
 * Disable Neo4j's defaults of showing nulls first for DESC sorting
 * and empty strings first for ASC sorting
 */
function getNeo4jCustomSort(sort: DashboardRecordSort) {
  return sort.sort === AgGridSortDirection.Desc
    ? `COALESCE(${sort.colId}, '') DESC`
    : `${sort.colId}='' ASC, ${sort.colId} ASC`;
}

async function updateSampleMetadata(
  newDashboardSample: DashboardSampleInput,
  ogm: OGM
) {
  return new Promise(async (resolve) => {
    const sampleManifest = await request(
      props.smile_sample_endpoint + newDashboardSample.primaryId,
      {
        json: true,
      }
    );

    Object.keys(newDashboardSample).forEach((key) => {
      if (key in sampleManifest) {
        sampleManifest[key] =
          newDashboardSample[key as keyof DashboardSampleInput];
      }
    });

    // Ensure validator and label generator use latest status data added during validation
    delete sampleManifest.status;

    // Ensure isCmoSample is set in sample's 'additionalProperties' if not already present
    if (sampleManifest.additionalProperties.isCmoSample == null) {
      // For research samples, this ensures that they get sent to the label generator after
      // validation as some of the older SMILE samples do not have this additionalProperty set
      if (sampleManifest.datasource === "igo") {
        const requestId = sampleManifest.additionalProperties.igoRequestId;
        let requestOgm = ogm.model("Request");
        const requestOfSample = await requestOgm.find({
          where: { igoRequestId: requestId },
        });
        sampleManifest.additionalProperties.isCmoSample =
          requestOfSample[0].isCmoRequest.toString();
      }

      if (sampleManifest.datasource === "dmp") {
        sampleManifest.additionalProperties.isCmoSample = false;
      }
    }

    publishNatsMessage(
      props.pub_validate_sample_update,
      JSON.stringify(sampleManifest)
    );

    await ogm.model("Sample").update({
      where: { smileSampleId: sampleManifest.smileSampleId },
      update: { revisable: false },
    });

    resolve(null);
  });
}

async function updateTempo(newDashboardSample: DashboardSampleInput) {
  return new Promise((resolve) => {
    const dataForTempoBillingUpdate = {
      primaryId: newDashboardSample.primaryId,
      billed: newDashboardSample.billed,
      billedBy: newDashboardSample.billedBy,
      costCenter: newDashboardSample.costCenter,
      accessLevel: newDashboardSample.accessLevel,
      custodianInformation: newDashboardSample.custodianInformation,
    };

    publishNatsMessage(
      props.pub_tempo_sample_billing,
      JSON.stringify(dataForTempoBillingUpdate)
    );

    resolve(null);
  });
}

const editableSampleMetadataFields = new Set([
  "cmoPatientId",
  "investigatorSampleId",
  "sampleType",
  "preservation",
  "tumorOrNormal",
  "sampleClass",
  "oncotreeCode",
  "collectionYear",
  "sampleOrigin",
  "tissueLocation",
]);

const editableTempoFields = new Set([
  "billed",
  "costCenter",
  "billedBy",
  "custodianInformation",
  "accessLevel",
]);

async function updateAllSamplesConcurrently(
  newDashboardSamples: DashboardSampleInput[],
  ogm: OGM
) {
  const allPromises = newDashboardSamples.map(async (dashboardSample) => {
    try {
      const metadataChanged = dashboardSample.changedFieldNames.some((field) =>
        editableSampleMetadataFields.has(field)
      );
      const tempoChanged = dashboardSample.changedFieldNames.some((field) =>
        editableTempoFields.has(field)
      );

      const promises = [];
      if (metadataChanged) {
        promises.push(updateSampleMetadata(dashboardSample, ogm));
      }
      if (tempoChanged) {
        promises.push(updateTempo(dashboardSample));
      }

      return Promise.all(promises);
    } catch (error) {
      console.error(
        `Failed to update sample with primaryId ${dashboardSample.primaryId}. Error:`,
        error
      );
      throw error; // ensure Promise.allSettled captures the error
    }
  });

  await Promise.allSettled(allPromises);
}

async function publishNatsMessage(topic: string, message: string) {
  const sc = StringCodec();

  const tlsOptions = {
    keyFile: props.nats_key_pem,
    certFile: props.nats_cert_pem,
    caFile: props.nats_ca_pem,
    rejectUnauthorized: false,
  };

  const natsConnProperties = {
    servers: [props.nats_url],
    user: props.nats_username,
    pass: props.nats_password,
    tls: tlsOptions,
  };

  try {
    const natsConn = await connect(natsConnProperties);
    console.info(
      `Publishing message to NATS server at ${natsConn.getServer()} under topic ${topic}: `,
      message
    );
    const h = headers();
    h.append("Nats-Msg-Subject", topic);
    natsConn.publish(topic, sc.encode(JSON.stringify(message)), { headers: h });
  } catch (err) {
    console.error(
      `error connecting to ${JSON.stringify(natsConnProperties)}`,
      err
    );
  }
}
