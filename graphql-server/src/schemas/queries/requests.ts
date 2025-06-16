import {
  DashboardRequest,
  QueryDashboardRequestsArgs,
} from "../../generated/graphql";
import { neo4jDriver } from "../../utils/servers";
import {
  buildFinalCypherFilter,
  getNeo4jCustomSort,
  buildCypherPredicateFromDateColumnFilter,
  buildCypherPredicateFromBooleanColumnFilter,
} from "../custom";

export function buildRequestsQueryBody({
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
      .map(
        (field) => `tempNode.${field} =~ '(?i).*(${searchVals.join("|")}).*'`
      )
      .join(" OR ");
    queryFilters.push(searchFilters);
  }

  if (filters) {
    const importDateFilter = buildCypherPredicateFromDateColumnFilter({
      filters,
      filterField: "importDate",
      dateVar: "tempNode.importDate",
    });
    if (importDateFilter) queryFilters.push(importDateFilter);

    const bicAnalysisFilter = buildCypherPredicateFromBooleanColumnFilter({
      filters,
      filterField: "bicAnalysis",
      booleanVar: "tempNode.bicAnalysis",
      noIncludesFalseAndNull: true,
    });
    if (bicAnalysisFilter) queryFilters.push(bicAnalysisFilter);

    const cmoRequestFilter = buildCypherPredicateFromBooleanColumnFilter({
      filters,
      filterField: "isCmoRequest",
      booleanVar: "tempNode.isCmoRequest",
      noIncludesFalseAndNull: true,
    });
    if (cmoRequestFilter) queryFilters.push(cmoRequestFilter);
  }

  const filtersAsCypher = buildFinalCypherFilter({ queryFilters });

  const requestsQueryBody = `
    MATCH (r:Request)

    WITH
      r,
      COLLECT {
        MATCH (r)-[:HAS_METADATA]->(rm:RequestMetadata)-[:HAS_STATUS]->(st:Status)
        RETURN { rm: rm, st: st } ORDER BY rm.importDate DESC LIMIT 1
      } AS latestRm

    OPTIONAL MATCH (r)-[:HAS_SAMPLE]->(s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)

    WITH
      r,
      latestRm[0].st AS latestStatus,
      COUNT(DISTINCT s.smileSampleId) AS totalSampleCount,
      apoc.coll.max(
        COLLECT(latestRm[0].rm.importDate) +
        COLLECT(DISTINCT sm.importDate)
      ) AS latestImportDate

    OPTIONAL MATCH (r)-[:HAS_SAMPLE]->(s:Sample)

    WITH
      r,
      latestStatus,
      totalSampleCount,
      latestImportDate,
      s,
      COLLECT {
        MATCH (s)-[:HAS_METADATA]->(sm:SampleMetadata)-[:HAS_STATUS]->(ss:Status)
        RETURN {primaryId: sm.primaryId, validationStatus: ss.validationStatus, validationReport: ss.validationReport}
        ORDER BY sm.importDate DESC LIMIT 1
      } as latestSampleData

    WITH
      r,
      latestStatus,
      totalSampleCount,
      latestImportDate,
      latestSampleData[0] as latestSampleData

    WITH
      r,
      latestStatus,
      totalSampleCount,
      latestImportDate,
      COLLECT(latestSampleData) as toleratedSampleErrors

    WITH
      ({igoRequestId: r.igoRequestId,
      igoProjectId: r.igoProjectId,
      validationReport: latestStatus.validationReport,
      validationStatus: latestStatus.validationStatus,
      importDate: latestImportDate,
      totalSampleCount: totalSampleCount,
      projectManagerName: r.projectManagerName,
      investigatorName: r.investigatorName,
      investigatorEmail: r.investigatorEmail,
      piEmail: r.piEmail,
      dataAnalystName: r.dataAnalystName,
      dataAnalystEmail: r.dataAnalystEmail,
      genePanel: r.genePanel,
      labHeadName: r.labHeadName,
      labHeadEmail: r.labHeadEmail,
      qcAccessEmails: r.qcAccessEmails,
      dataAccessEmails: r.dataAccessEmails,
      bicAnalysis: r.bicAnalysis,
      isCmoRequest: r.isCmoRequest,
      otherContactEmails: r.otherContactEmails,
      toleratedSampleErrors: toleratedSampleErrors}) as tempNode
    WITH tempNode

    ${filtersAsCypher}
  `;

  return requestsQueryBody;
}
export async function queryDashboardRequests({
  queryBody,
  sort,
  limit,
  offset,
}: {
  queryBody: string;
  sort: QueryDashboardRequestsArgs["sort"];
  limit: QueryDashboardRequestsArgs["limit"];
  offset: QueryDashboardRequestsArgs["offset"];
}): Promise<DashboardRequest[]> {
  const cypherQuery = `
    ${queryBody}
    WITH COUNT(DISTINCT tempNode) AS total, COLLECT(DISTINCT tempNode) AS results
    UNWIND results as resultz
    WITH resultz, total

    RETURN
      resultz{.*, _total: total}
    ORDER BY ${getNeo4jCustomSort(sort)}
    SKIP ${offset}
    LIMIT ${limit}
  `;

  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records.map((record) => {
      return record.toObject().resultz;
    });
  } catch (error) {
    console.error("Error with queryDashboardRequests:", error);
    return [];
  } finally {
    await session.close();
  }
}
