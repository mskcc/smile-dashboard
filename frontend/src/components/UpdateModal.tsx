import React, { FunctionComponent } from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

/* TODOs by priority
- Store cell updates in the changes object
- Submit Updates button to make a Mutation call to GraphQL server
- UpdateModal to have an overlay effect on the RequestSamples page
- Fix the closeButton not working
- Fix not being able to "click out" of the modal
*/

export const UpdateModal: FunctionComponent<{
  changes: object;
  onHide: () => void;
}> = ({ changes, onHide }) => {
  return (
    <Modal show={true} size={"lg"} centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Are you sure?
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you want to submit the following changes?</p>
        <pre>{JSON.stringify(changes, null, 2)}</pre>
      </Modal.Body>

      <Modal.Footer>
        <Button className={"btn btn-secondary"} onClick={onHide}>
          Cancel
        </Button>
        <Button className={"btn btn-success"} onClick={onHide}>
          Submit Updates
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
