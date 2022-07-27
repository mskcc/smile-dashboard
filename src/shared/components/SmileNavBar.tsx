import * as React from "react";
import { Container, Nav, Form, Button, InputGroup } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";
import logo_with_text from "../../imgs/logo_with_text.png";

class SmileNavBar extends React.Component {
  requestIdSearch: string;
  constructor(props: {}) {
    super(props);
    this.requestIdSearch = "";
  }

  render() {
    return (
      <Navbar bg="light" expand="lg" variant="light" className="gap-3 px-3">
        <Container>
          <Navbar.Brand href="/home">
            <img
              alt=""
              src={logo_with_text}
              width="110"
              height="40"
              className="d-inline-block align-top"
            />{" "}
          </Navbar.Brand>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="flex-grow-1 justify-content-evenly">
              <Nav.Item>
                <Nav.Link href="/home">Home</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link href="/recentDeliveries">Recent Deliveries</Nav.Link>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
          <Nav.Item>
            <InputGroup>
              <Form className="d-flex">
                <Form.Group>
                  <Form.Control
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                    defaultValue=""
                    onChange={event => {
                      const value = String(
                        ((event.currentTarget as unknown) as HTMLInputElement)
                          .value
                      );
                      if (value !== null) {
                        this.requestIdSearch = String(value);
                      }
                    }}
                  />
                </Form.Group>
                <Button
                  type="submit"
                  onClick={() => {
                    if (this.requestIdSearch !== "") {
                      var url = `/requests/${this.requestIdSearch}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Search
                </Button>
              </Form>
            </InputGroup>
          </Nav.Item>
        </Container>
      </Navbar>
    );
  }
}

export default SmileNavBar;
