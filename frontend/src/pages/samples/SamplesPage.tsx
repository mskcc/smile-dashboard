import React from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import PageHeader from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";
import { SampleWhere } from "../../generated/graphql";

export const SamplesPage: React.FunctionComponent = (props) => {
  const pageRoute = "/samples";

  return (
    <>
      <PageHeader pageTitle={"samples"} pageRoute={pageRoute} />

      <SamplesList
        height={540}
        searchVariables={
          {
            hasMetadataSampleMetadata_SOME: {
              igoRequestId: "08944_B", // placeholder
            },
          } as SampleWhere
        }
      />
    </>
  );
};

export default SamplesPage;
