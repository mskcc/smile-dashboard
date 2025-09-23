import { Button, Container, Form, Modal, Row } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import React, { useState } from "react";

interface CohortBuilderContainerProps {
  selectedRowIds: string[];
  // gridRef: React.RefObject<AgGridReact<any>>;
  // showCohortBuilder: boolean;
  // setShowCohortBuilder: React.Dispatch<React.SetStateAction<boolean>>;
  // handleAddToCohort: () => void;
}

export interface CohortBuilderFormMetadata {
  endusers: string[];
  pmUsers: string[];
  projectTitle: string;
  projectSubtitle: string;
  cohortBuilderSamples: CohortBuilderSample[];
}

export interface CohortBuilderSample {
  primaryId: string;
}

const cohortBuilderColDefs = [
  {
    headerName: "primaryId",
    field: "primaryId",
    sortable: true,
    filter: true,
  },
];

// export function makeCohortBuilder(
//   selectedRowIds: string[],
//   setIsSelectedPopupClosed: (value: boolean) => void
// ) {
//   return (
//     <Container
//       className="ag-theme-alpine flex-grow-1"
//       style={{
//         border: "1px solid #ccc",
//         borderRadius: "5px",
//         backgroundColor: "#f9f9f9",
//       }}
//     >
//       <Row
//         className="d-flex align-items-center justify-content-left my-2"
//         style={{ padding: "10px" }}
//       >
//         <Form.Control
//           type="search"
//           className="d-inline-block"
//           style={{ width: "300px", padding: "10px" }}
//           size="sm"
//           placeholder={`Project title`}
//           aria-label="Project title"
//           value={""}
//           onChange={(e: { currentTarget: { value: any } }) => {
//             const currentValue = e.currentTarget.value;
//           }}
//         />
//       </Row>

//       {console.log("\n\n\nROW DATA FOR POPUP:", selectedRowIds)}

//       <AgGridReact
//         columnDefs={cohortBuilderColDefs}
//         rowData={selectedRowIds.map((id) => ({ primaryId: id }))}
//       />
//       <br />
//       <Button
//         variant="secondary"
//         onClick={() => setIsSelectedPopupClosed(true)}
//       >
//         Close
//       </Button>
//     </Container>
//   );
// }

export function CohortBuilderContainer({
  selectedRowIds,
}: CohortBuilderContainerProps) {
  const [isSelectedPopupClosed, setIsSelectedPopupClosed] = useState(true);

  const formattedRowData = selectedRowIds.map((id) => ({ primaryId: id }));

  return (
    <Container
      className="ag-theme-alpine flex-grow-1"
      style={{
        border: "1px solid #ccc",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Row
        className="d-flex align-items-center justify-content-left my-2"
        style={{ padding: "10px" }}
      >
        <Form.Control
          type="search"
          className="d-inline-block"
          style={{ width: "300px", padding: "10px" }}
          size="sm"
          placeholder={`Project title`}
          aria-label="Project title"
          value={""}
          onChange={(e: { currentTarget: { value: any } }) => {
            const currentValue = e.currentTarget.value;
          }}
        />
      </Row>

      {console.log("\n\n\nROW DATA FOR POPUP:", selectedRowIds)}

      <AgGridReact
        columnDefs={cohortBuilderColDefs}
        rowData={formattedRowData}
      />
      <br />
      <Button
        variant="secondary"
        onClick={() => setIsSelectedPopupClosed(true)}
      >
        Close
      </Button>
    </Container>
  );
}

// export function CohortBuilderContainer({
//   gridRef,
//   showCohortBuilder,
//   setShowCohortBuilder,
//   handleAddToCohort,
// }: CohortBuilderContainerProps) {
//   return (
//     <>
//       <Modal
//         show={showCohortBuilder}
//         onHide={() => setShowCohortBuilder(false)}
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Add Selected Samples to Cohort</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <p>
//             You have selected{" "}
//             {gridRef.current?.api.getSelectedRows().length || 0} samples to add
//             to a new cohort.
//           </p>
//           <p>Would you like to proceed?</p>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => setShowCohortBuilder(false)}
//           >
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={handleAddToCohort}>
//             Add to Cohort
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// }
