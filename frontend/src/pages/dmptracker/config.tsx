import { Col } from "react-bootstrap";
import { DmpTrackerRecord } from "../../generated/graphql";
import { ColDef } from "ag-grid-enterprise";
import { BuildDownloadOptionsParamsBase } from "../../types/shared";
import { DownloadOption } from "../../hooks/useDownload";

export const dmpTrackerColDefs: Array<ColDef<DmpTrackerRecord>> = [
  { field: "record_id", headerName: "Record ID" },
  { field: "id", headerName: "ID" },
  { field: "sample_status", headerName: "Sample status for WES samples only" },
  { field: "duplicate_sample", headerName: "Duplicate Sample" },
  { field: "request_reference_number", headerName: "iLabRequest ID" },
  { field: "cmo_plate_id", headerName: "CMO Plate ID" },
  { field: "date_submitted_to_dmp", headerName: "Date Submitted to DMP" },
  {
    field: "pm_investigator_notification_status",
    headerName: "PM/Investigator Notification Status",
  },
  { field: "specimen_type", headerName: "Specimen Type" },
  {
    field: "molecular_pathology_accession_number",
    headerName: "Molecular Pathology Accession Number ",
  },
  { field: "dmp_sample_id", headerName: "DMPSampleID" },
  {
    field: "patient_id",
    headerName: "Study Subject Identifier (Investigator Patient ID)",
  },
  { field: "sample_id", headerName: "Sample ID" },
  { field: "wes_id", headerName: "WES ID" },
  { field: "tumor_or_normal", headerName: "Sample Type (Tumor or Normal)" },
  {
    field: "sample_downstream_application",
    headerName: "Sample Downstream Application",
  },
  { field: "study_name", headerName: "Study name" },
  { field: "primary_investigator", headerName: "Primary Investigator" },
  { field: "fund_cost_center", headerName: "Fund/Cost Center" },
  { field: "tumor_type", headerName: "Tumor Type" },
  { field: "baitset", headerName: "Baitset" },
  { field: "sequencer", headerName: "Sequencer" },
  { field: "data_custodian", headerName: "Data Custodian" },
  { field: "tempo_pipeline_status", headerName: "TEMPO Pipeline Status" },
  {
    field: "tempo_output_delivery_date",
    headerName: "Tempo Output Delivery Date",
  },
  { field: "project_manager", headerName: "Project Manager" },
  { field: "igo_project_number", headerName: "IGO Project Number" },
  { field: "igo_request_id_edited", headerName: "IGO Request ID (Edited)" },
  { field: "request_date", headerName: "Request Date" },
  { field: "igo_delivery_date", headerName: "IGO Delivery Date" },
  { field: "igo_id", headerName: "IGO ID" },
  { field: "alt_id", headerName: "Alt Id" },
  {
    field: "investigator_sample_id",
    headerName: "Investigator Sample ID (historical)",
  },
  { field: "cmo_comments", headerName: "CMO Comments" },
  { field: "chargeback_applied", headerName: "Chargeback Applied" },
  {
    field: "igo_request_id_not_edited",
    headerName: "IGO Request ID  (Not Edited)",
  },
  {
    field: "amount_of_material_requested_ng",
    headerName: "Amount of Material Requested (ng)",
  },
  {
    field: "dna_input_into_library_ng",
    headerName: "Dna Input into Library (ng)",
  },
  { field: "barcode_index", headerName: "Barcode Index" },
  { field: "truseq_barcode_id", headerName: "TruSeq Barcode Id" },
  {
    field: "library_concentration_ngul",
    headerName: "Library Concentration (ng/ul)",
  },
  {
    field: "orginal_dna_concentration",
    headerName: "Orginal Dna concentration ",
  },
  { field: "final_amount_ng", headerName: "Final Amount (ng)" },
  { field: "provided_amount_ul", headerName: "Provided Amount (ul)" },
  { field: "well_id", headerName: "Well ID" },
  { field: "dmp_comment", headerName: "DMP Comment" },
  { field: "additional_comments", headerName: "Additional Comments" },
  { field: "record_id_copy", headerName: "Record ID Copy" },
  { field: "created_by", headerName: "Created By" },
  { field: "date_created", headerName: "Date Created" },
  { field: "related_directory", headerName: "Related Directory" },
  { field: "last_modified_by", headerName: "Last Modified By" },
  { field: "last_modified_date", headerName: "Last Modified Date" },
];

type BuildDownloadOptionsParams = BuildDownloadOptionsParamsBase & {
  // Put additional parameters here if needed
};

export function buildDownloadOptions({
  getCurrentData,
  currentColDefs: currentColumnDefs,
}: BuildDownloadOptionsParams): Array<DownloadOption> {
  return [
    {
      buttonLabel: "Download as TSV",
      columnDefsForDownload: currentColumnDefs,
      dataGetter: getCurrentData,
    },
  ];
}
