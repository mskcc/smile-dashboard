import {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import styles from "./records.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { SampleChange } from "../shared/helpers";
import { Sample, useUpdateSamplesMutation } from "../generated/graphql";
import _ from "lodash";
import { REACT_APP_EXPRESS_SERVER_ORIGIN } from "../shared/constants";
import { getUserEmail } from "../utils/getUserEmail";

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

  const handleSubmitUpdates = useCallback(() => {
    const changesByPrimaryId: {
      [primaryId: string]: {
        [fieldName: string]: string;
      };
    } = {};
    for (const c of changes) {
      const { primaryId, fieldName, newValue } = c;
      if (changesByPrimaryId[primaryId]) {
        changesByPrimaryId[primaryId][fieldName] = newValue;
      } else {
        changesByPrimaryId[primaryId] = { [fieldName]: newValue };
      }
    }

    const changesIncludeBilled = changes.some((c) => c.fieldName === "billed");
    if (changesIncludeBilled) {
      if (userEmail) {
        for (const [, changes] of Object.entries(changesByPrimaryId)) {
          if ("billed" in changes) {
            changes["billedBy"] = userEmail.split("@")[0];
          }
        }
      } else {
        const width = 800;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
          `${REACT_APP_EXPRESS_SERVER_ORIGIN}/auth/login`,
          "_blank",
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
        );

        return;
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
  }, [
    changes,
    onHide,
    onSuccess,
    sampleKeyForUpdate,
    samples,
    updateSamplesMutation,
    userEmail,
  ]);

  useEffect(() => {
    window.addEventListener("message", handleLogin);

    async function handleLogin(event: MessageEvent) {
      if (setUserEmail) {
        if (event.data !== "success") return;

        const userEmail = await getUserEmail();
        setUserEmail(userEmail);

        handleSubmitUpdates();
      }
    }

    return () => {
      window.removeEventListener("message", handleLogin);
    };
  }, [handleSubmitUpdates, setUserEmail]);

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
