import React, { FunctionComponent } from "react";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-spinkit";

export const DiscardChangesModal: FunctionComponent<{}> = () => {
  return (
    <Modal show={true} size={"sm"}>
      <Modal.Body>
        <div className="d-flex flex-column align-items-center">
          <p>Discarding changes ...</p>
          <Spinner fadeIn={"none"} color={"lightblue"} name="ball-grid-pulse" />
        </div>
      </Modal.Body>
    </Modal>
  );
};
