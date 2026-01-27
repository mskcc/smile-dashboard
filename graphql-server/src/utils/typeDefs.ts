import { gql } from "apollo-server";

const GENERIC_TYPEDEFS = gql`
  enum AgGridSortDirection {
    asc
    desc
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

  input DashboardRecordColumnFilter {
    # The field to filter on, e.g. "smileSampleId", "cmoPatientId", etc.
    field: String!
    # Can be a single value or an array of values to filter on. Comes from AG Grid's filter model object
    filter: String!
  }
`;

const SAMPLE_FIELDS = `
  # (s:Sample)
  smileSampleId: String!
  revisable: Boolean
  sampleCategory: String!

  # (s:Sample)-[:HAS_METADATA]->(sm:SampleMetadata)
  ## Root-level fields
  primaryId: String
  cmoSampleName: String
  importDate: String
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
  cfDNA2dBarcode: String
  ## Custom fields
  recipe: String
  altId: String
  analyteType: String
  historicalCmoSampleNames: String
  instrumentModel: String
  platform: String
  igoSampleStatus: String
  dmpRecommendedCoverage: String
  ## (sm:SampleMetadata)-[:HAS_STATUS]->(s:Status)
  validationReport: String
  validationStatus: Boolean

  # Oncotree API
  cancerType: String
  cancerTypeDetailed: String

  # (s:Sample)-[:HAS_TEMPO]->(t:Tempo)
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
  # (s:Sample)<-[:HAS_COHORT_SAMPLE]-(c:Cohort)
  sampleCohortIds: String

  # (s:Sample)-[:HAS_DBGAP]->(d:DbGap)
  dbGapStudy: String
  irbConsentProtocol: String

  # (r:Request)-[:HAS_SAMPLE]->(s:Sample)
  igoDeliveryDate: String

  # (s:Sample)<-[:HAS_SAMPLE]-(p:Patient)<-[:IS_ALIAS]-(pa:PatientAlias)
  ## Custom fields
  dmpPatientAlias: String

  # Databricks
  sequencingDate: String
  race: String

  # results total
  _total: Int
`;

const QUERY_RESULT_TYPEDEFS = gql`
  type DashboardRequest {
    igoRequestId: String!
    igoProjectId: String
    ilabRequestId: String
    igoDeliveryDate: String
    validationReport: String
    validationStatus: Boolean
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
    _total: Int
    toleratedSampleErrors: [ToleratedSampleValidationError]
  }

  type ToleratedSampleValidationError {
    primaryId: String!
    validationStatus: Boolean
    validationReport: String
  }

  type DashboardPatient {
    smilePatientId: String!
    cmoPatientId: String
    dmpPatientId: String
    totalSampleCount: Int
    cmoSampleIds: String
    consentPartA: String
    consentPartC: String
    inDbGap: Boolean
    mrn: String
    anchorSequencingDate: String
    anchorOncotreeCode: String
    race: String
    _total: Int
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
    pipelineVersion: String
    searchableSampleIds: String
    _total: Int
    _uniqueSampleCount: Int
  }

  type DashboardSample {
    ${SAMPLE_FIELDS}
  }

  type PatientIdsTriplet {
    CMO_PATIENT_ID: String!
    DMP_PATIENT_ID: String
    MRN: String!
    RACE: String
  }

  type AnchorSeqDateData {
    MRN: String!
    DMP_PATIENT_ID: String!
    ANCHOR_SEQUENCING_DATE: String!
    ANCHOR_ONCOTREE_CODE: String!
  }

  type SeqDateBySampleId {
    DMP_SAMPLE_ID: String!
    SEQUENCING_DATE: String!
  }

  type TempoCohortSample {
    primaryId: String!
    cmoId: String
    embargoDate: String
  }

  type TempoCohortRequest {
    cohortId: String!
    projectTitle: String!
    projectSubtitle: String!
    endUsers: String!
    pmUsers: String!
    type: String!
    samples: [TempoCohortSample!]!
  }

  type DmpTrackerRecord {
    sample_status: String
    duplicate_sample: String
    request_reference_number: String
    cmo_plate_id: String
    date_submitted_to_dmp: String
    pm_investigator_notification_status: String
    specimen_type: String
    molecular_pathology_accession_number: String
    dmp_sample_id: String
    patient_id: String
    sample_id: String
    wes_id: String
    tumor_or_normal: String
    sample_downstream_application: String
    study_name: String
    primary_investigator: String
    fund_cost_center: String
    tumor_type: String
    baitset: String
    sequencer: String
    data_custodian: String
    tempo_pipeline_status: String
    tempo_output_delivery_date: String
    project_manager: String
    igo_project_number: String
    igo_request_id_edited: String
    request_date: String
    igo_delivery_date: String
    igo_id: String
    alt_id: String
    investigator_sample_id: String
    cmo_comments: String
    chargeback_applied: String
    igo_request_id_not_edited: String
    amount_of_material_requested_ng: String
    dna_input_into_library_ng: String
    barcode_index: String
    truseq_barcode_id: String
    library_concentration_ngul: String
    orginal_dna_concentration: String
    final_amount_ng: String
    provided_amount_ul: String
    well_id: String
    dmp_comment: String
    additional_comments: String
    record_id_copy: String
    record_id: String
    id: String
    created_by: String
    date_created: String
    related_directory: String
    last_modified_by: String
    last_modified_date: String
    _total: Int
  }
`;

const QUERY_TYPEDEFS = gql`
  type Query {
    dashboardRequests(
      searchVals: [String!]
      columnFilters: [DashboardRecordColumnFilter!]
      sort: DashboardRecordSort!
      limit: Int!
      offset: Int!
    ): [DashboardRequest!]!

    dashboardPatients(
      searchVals: [String!]
      columnFilters: [DashboardRecordColumnFilter!]
      sort: DashboardRecordSort!
      limit: Int!
      offset: Int!
      phiEnabled: Boolean
    ): [DashboardPatient!]!

    dashboardCohorts(
      searchVals: [String!]
      columnFilters: [DashboardRecordColumnFilter!]
      sort: DashboardRecordSort!
      limit: Int!
      offset: Int!
    ): [DashboardCohort!]!

    dashboardSamples(
      searchVals: [String!]
      recordContexts: [DashboardRecordContext]
      columnFilters: [DashboardRecordColumnFilter!]
      sort: DashboardRecordSort!
      limit: Int!
      offset: Int!
      phiEnabled: Boolean
      includeDemographics: Boolean!
    ): [DashboardSample!]!

    allAnchorSeqDateData(phiEnabled: Boolean): [AnchorSeqDateData!]!

    allBlockedCohortIds: [String!]!

    dmpTrackerRecords(
      searchVals: [String!]
      columnFilters: [DashboardRecordColumnFilter!]
      sort: DashboardRecordSort!
      limit: Int!
      offset: Int!
    ): [DmpTrackerRecord!]!
  }
`;

// We have to define a separate "input" type for the mutation and can't reuse DashboardSample.
// For more context, see: https://stackoverflow.com/q/41743253
const MUTATION_TYPEDEFS = gql`
  input DashboardSampleInput {
    changedFieldNames: [String!]!
    ${SAMPLE_FIELDS}
  }

  input DashboardCohortInput {
    changedFieldNames: [String!]!
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
    pipelineVersion: String
    searchableSampleIds: String
    _total: Int
    _uniqueSampleCount: Int
  }

  input TempoCohortSampleInput {
    primaryId: String!
    cmoId: String
    embargoDate: String
  }

  input TempoCohortRequestInput {
    cohortId: String!
    projectTitle: String!
    projectSubtitle: String!
    endUsers: [String!]!
    pmUsers: [String!]!
    type: String!
    samples: [TempoCohortSampleInput!]!
  }

  type Mutation {
    updateDashboardSamples(
      newDashboardSamples: [DashboardSampleInput]
    ): [DashboardSample]

    updateTempoCohort(
      dashboardCohort: DashboardCohortInput
    ): DashboardCohort

    publishNewTempoCohortRequest(
      tempoCohortRequest: TempoCohortRequestInput
    ): TempoCohortRequest
  }
`;

export const typeDefs = [
  GENERIC_TYPEDEFS,
  QUERY_RESULT_TYPEDEFS,
  QUERY_TYPEDEFS,
  MUTATION_TYPEDEFS,
];
