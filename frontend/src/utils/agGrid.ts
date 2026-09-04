import { ColDef, IFilterDef } from "ag-grid-community";
import moment from "moment";

export function formatCellDate(date: moment.MomentInput) {
  return date ? moment(date).format("YYYY-MM-DD") : null;
}

export function getAgGridDateColFilterConfigs({
  maxValidYear = new Date().getFullYear(),
}: { maxValidYear?: number } = {}): IFilterDef {
  return {
    filter: "agDateColumnFilter",
    filterParams: {
      buttons: ["apply", "reset"],
      // Custom After/Before/On date filter options (in addition to the built-in "In range")
      // Since filtering happens server-side, predicate is a no-op;
      // the actual matching logic lives in `buildCypherPredicateFromDateColFilter`.
      filterOptions: [
        "inRange",
        {
          displayKey: "after",
          displayName: "After",
          numberOfInputs: 1,
          predicate: () => true,
        },
        {
          displayKey: "before",
          displayName: "Before",
          numberOfInputs: 1,
          predicate: () => true,
        },
        {
          displayKey: "on",
          displayName: "On",
          numberOfInputs: 1,
          predicate: () => true,
        },
      ],
      inRangeInclusive: true,
      minValidYear: 2016,
      maxValidYear: maxValidYear,
      suppressAndOrCondition: true,
    },
  };
}

export function getAgGridBooleanColFilterConfigs({
  showBlanksFilterOption = false,
}: { showBlanksFilterOption?: Boolean } = {}): IFilterDef {
  return {
    filter: true,
    filterParams: {
      values: !showBlanksFilterOption ? ["Yes", "No"] : ["Yes", "No", ""],
      suppressMiniFilter: true,
    },
  };
}

export function getAgGridBooleanValueFormatter({
  trueVal,
  falseVal,
}: {
  // The true/false values that appear in the database for the given field
  trueVal: String | Boolean;
  falseVal: String | Boolean;
}): ColDef {
  return {
    valueFormatter: (params) => {
      switch (params.value) {
        case trueVal:
          return "Yes";
        case falseVal:
          return "No";
        default:
          return "";
      }
    },
  };
}

export function isInvalidCostCenter(fieldName: string, value: string) {
  if (!value || fieldName !== "costCenter") return false;
  if (value.length < 11 || value.length > 15) return true;
  // support both legacy cost centers and restamped cost centers
  const validCostCenter = new RegExp("^\\w{5,9}/\\d{5}$");
  return !validCostCenter.test(value);
}

export function isInvalidCmoPatientId(fieldName: string, value: string) {
  // if field not cmoPatientId then return false
  if (fieldName !== "cmoPatientId") return false;
  // if value is blank and field is cmoPatientId then return invalid
  if (!value && fieldName === "cmoPatientId") return true;
  const validCmoPatientId = new RegExp("^C-\\w{6}$");
  return !validCmoPatientId.test(value);
}
