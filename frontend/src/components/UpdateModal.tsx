import { useState, FunctionComponent, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import styles from "../pages/requests/requests.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { CellChange, ChangeForSubmit } from "../pages/requests/helpers";
import { useUpdateSamplesMutation } from "../generated/graphql";

export const UpdateModal: FunctionComponent<{
  changes: CellChange[];
  onSuccess: () => void;
  onHide: () => void;
}> = ({ changes, onHide, onSuccess }) => {
  const [rowData, setRowData] = useState(changes);
  const [columnDefs] = useState([
    { field: "primaryId", rowGroup: true, hide: true },
    { field: "fieldName" },
    { field: "oldValue" },
    { field: "newValue" },
  ]);

  useEffect(() => {
    setRowData(changes);
  }, [changes]);

  const autoGroupColumnDef = useMemo(() => {
    return {
      headerName: "Primary Id",
      field: "primaryId",
    };
  }, []);

  const [updateSamplesMutation, { data, loading, error }] =
    useUpdateSamplesMutation();

  const handleSubmitUpdates = () => {
    const changesForSubmit: ChangeForSubmit = {};
    for (const c of changes) {
      let sample = changesForSubmit[c.primaryId];
      if (sample) {
        sample.newValues[c.fieldName] = c.newValue;
      } else {
        sample = {
          newValues: {
            [c.fieldName]: c.newValue,
          },
          data: c.data,
        };
      }
    }

    for (const [key, value] of Object.entries(changesForSubmit)) {
      updateSamplesMutation({
        variables: {
          where: {
            hasMetadataSampleMetadataConnection_SOME: {
              node: {
                primaryId: key,
              },
            },
          },
          update: {
            revisable: false,
            hasMetadataSampleMetadata: [
              {
                update: {
                  node: value.newValues,
                },
              },
            ],
          },
        },
        optimisticResponse: {
          updateSamples: {
            samples: [
              {
                hasMetadataSampleMetadata: [
                  /* @ts-ignore */
                  value.data,
                ],
              },
            ],
          },
        },
      });
    }

    onSuccess();
    onHide();
  };

  return (
    <Modal
      show={true}
      size={"lg"}
      centered
      onHide={onHide}
      className={styles.overlay}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Are you sure?
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you want to submit the following changes?</p>
        <div className="ag-theme-alpine" style={{ height: 350 }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            groupRemoveSingleChildren={true}
            autoGroupColumnDef={autoGroupColumnDef}
            groupDefaultExpanded={1}
          ></AgGridReact>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button className={"btn btn-secondary"} onClick={onHide}>
          Cancel
        </Button>
        <Button className={"btn btn-success"} onClick={handleSubmitUpdates}>
          Submit Updates
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
