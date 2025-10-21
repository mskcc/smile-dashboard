import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import React, { RefObject } from "react";
import { CohortBuilderSample } from "./CohortBuilderContainer";
import { Button } from "react-bootstrap";
import { RemoveCircleOutline } from "@material-ui/icons";

export interface DeselectCohortSampleButtonProps {
  data: any;
  selectedRowIds: CohortBuilderSample[];
  setSelectedRowIds?: React.Dispatch<
    React.SetStateAction<CohortBuilderSample[]>
  >;
  gridRef: RefObject<AgGridReactType<any>>;
}

export function DeselectCohortSampleButton({
  gridRef,
  data,
  selectedRowIds,
  setSelectedRowIds,
}: DeselectCohortSampleButtonProps) {
  const handleClick = () => {
    const filteredRowIds = selectedRowIds.filter(
      (sample) => sample.primaryId !== data.primaryId
    );
    // updates cohort selection state
    if (setSelectedRowIds) {
      setSelectedRowIds(filteredRowIds);
    }

    // updates main samples table
    if (gridRef.current?.api) {
      // @ts-ignore
      gridRef.current.api.getSelectedNodes().map((node: any) => {
        if (node.data.primaryId === data.primaryId) {
          node.setSelected(false);
        }
      });
    }
  };

  return (
    <Button
      style={{ background: "transparent", border: "none", padding: 0 }}
      onClick={handleClick}
      title="Remove from cohort"
    >
      <RemoveCircleOutline
        style={{ fontSize: 18, color: "grey", padding: 0 }}
      />
    </Button>
  );
}
