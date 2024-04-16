import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import styles from "./records.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ChangesByPrimaryId, SampleChange } from "../shared/helpers";
import { Sample, useUpdateSamplesMutation } from "../generated/graphql";
import _ from "lodash";
import { getUserEmail } from "../utils/getUserEmail";
import { openLoginPopup } from "../utils/openLoginPopup";

function populateBilledBy(
  changesByPrimaryId: ChangesByPrimaryId,
  userEmail: string
) {
  for (const [, changes] of Object.entries(changesByPrimaryId)) {
    if ("billed" in changes) {
      changes["billedBy"] = userEmail!.split("@")[0];
    }
  }
}

interface UpdateModalProps {
  changes: SampleChange[];
  onSuccess: () => void;
  onHide: () => void;
  samples: Sample[];
  onOpen?: () => void;
  sampleKeyForUpdate: keyof Sample;
  userEmail?: string | null;
  setUserEmail?: Dispatch<SetStateAction<string | null>>;
}

export function UpdateModal({
  changes,
  onHide,
  onSuccess,
  onOpen,
  samples,
  sampleKeyForUpdate,
  userEmail,
  setUserEmail,
}: UpdateModalProps) {
  const [rowData, setRowData] = useState(changes);
  const [columnDefs] = useState([
    { field: "primaryId", rowGroup: true, hide: true },
    { field: "fieldName" },
    { field: "oldValue" },
    { field: "newValue" },
  ]);

  useEffect(() => {
    onOpen && onOpen();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setRowData(changes);
  }, [changes]);

  const [updateSamplesMutation] = useUpdateSamplesMutation();

  async function handleSubmitUpdates() {
    const changesByPrimaryId: ChangesByPrimaryId = {};
    for (const c of changes) {
      const { primaryId, fieldName, newValue } = c;
      if (changesByPrimaryId[primaryId]) {
        changesByPrimaryId[primaryId][fieldName] = newValue;
      } else {
        changesByPrimaryId[primaryId] = { [fieldName]: newValue };
      }
    }

    if (setUserEmail) {
      if (!changes.some((c) => c.fieldName === "billed")) return;

      if (!userEmail) {
        const logInUser = new Promise<string | null>((resolve) => {
          window.addEventListener("message", handleLogin);
          openLoginPopup();

          async function handleLogin(event: MessageEvent) {
            if (event.data === "success") {
              const userEmail = await getUserEmail();
              window.removeEventListener("message", handleLogin);
              resolve(userEmail);
            }
          }
        });

        const userEmail = await logInUser;
        if (userEmail) {
          setUserEmail(userEmail);
          populateBilledBy(changesByPrimaryId, userEmail);
        } else {
          return;
        }
      } else {
        populateBilledBy(changesByPrimaryId, userEmail);
      }
    }

    const updatedSamples = _.cloneDeep(samples);
    updatedSamples?.forEach((s) => {
      const primaryId = s.hasMetadataSampleMetadata[0].primaryId;
      if (primaryId in changesByPrimaryId) {
        s.revisable = false;

        _.forEach(changesByPrimaryId[primaryId], (v, k) => {
          /* @ts-ignore */
          s[sampleKeyForUpdate][0][k] = v;
        });
      }
    });

    for (const [key, value] of Object.entries(changesByPrimaryId)) {
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
            [sampleKeyForUpdate]: [
              {
                update: {
                  node: value!,
                },
              },
            ],
          },
        },
        optimisticResponse: {
          updateSamples: {
            samples: updatedSamples,
          },
        },
      });
    }

    onSuccess();
    onHide();
  }

  const autoGroupColumnDef = useMemo(() => {
    return {
      headerName: "Primary Id",
      field: "primaryId",
    };
  }, []);

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
}
