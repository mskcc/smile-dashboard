import { CohortBuilderSample } from "../components/CohortBuilderContainer";
import { TempoCohortRequest } from "../generated/graphql";

const VALID_COHORT_TYPES = new Set(["investigator", "operational"]);

export function validateCohortBuilderInput(
  tempoCohortRequest: TempoCohortRequest,
  cohortSamples: CohortBuilderSample[]
) {
  // Simple validation: check required fields are filled and at least one sample
  if (
    tempoCohortRequest.cohortId.trim() === "" ||
    tempoCohortRequest.projectTitle.trim() === "" ||
    tempoCohortRequest.projectSubtitle.trim() === "" ||
    tempoCohortRequest.endUsers.length === 0 ||
    tempoCohortRequest.pmUsers.length === 0 ||
    tempoCohortRequest.type.trim() === ""
  ) {
    alert("Missing one or more required fields.");
    return false;
  }
  if (!VALID_COHORT_TYPES.has(tempoCohortRequest.type)) {
    // these are fixed options so if this check fails then something is seriously wrong
    alert(
      `Invalid cohort type: ${
        tempoCohortRequest.type
      }\nMust be one of: ${Array.from(VALID_COHORT_TYPES).join(", ")}`
    );
    return false;
  }
  if (cohortSamples.length === 0) {
    alert("Cohort must contain at least one sample.");
    return false;
  }
  return true;
}
