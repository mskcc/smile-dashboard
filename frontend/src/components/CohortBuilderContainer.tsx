import { Button, Modal } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";

interface CohortBuilderContainerProps {
  gridRef: React.RefObject<AgGridReact<any>>;
  showCohortBuilder: boolean;
  setShowCohortBuilder: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddToCohort: () => void;
}

export function CohortBuilderContainer({
  gridRef,
  showCohortBuilder,
  setShowCohortBuilder,
  handleAddToCohort,
}: CohortBuilderContainerProps) {
  return (
    <>
      <Modal
        show={showCohortBuilder}
        onHide={() => setShowCohortBuilder(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Selected Samples to Cohort</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You have selected{" "}
            {gridRef.current?.api.getSelectedRows().length || 0} samples to add
            to a new cohort.
          </p>
          <p>Would you like to proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCohortBuilder(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddToCohort}>
            Add to Cohort
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
