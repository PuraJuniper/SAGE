/* eslint-disable no-undef */
/* eslint-disable react/no-string-refs */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import {Container, Row, Col, Modal, Tabs, Tab, Dropdown, DropdownButton} from "react-bootstrap";
import State from "../state";

class SelectResourceDialog extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.show !== this.props.show;
    }

    handleClose(e) {
        return State.emit("set_ui", "ready");
    }

    handleClick(pos, e) {
		e.preventDefault();
        State.emit("set_ui", "ready");
		return State.emit("set_selected_canonical", this.props.node, pos);
	}

    handleMenu(e, item) {
		return State.emit(e);
	}

    handleUiChange(status, e) {
		e.preventDefault();
		return State.emit("set_ui", status);
	}

    renderResourceInput() {
        const resources = this.props.bundle.resources;

        return (
            <Container>
                <Row className ="row">
                    <Col md="12">
                        <form className="navbar-form">

				{resources.map((resource, i) => {
					const className = (() => {
                        // FontAwesome icons
						if (resource.resourceType === "PlanDefinition") {
						return "far fa-folder-open";
					} else if (resource.resourceType === "ActivityDefinition") {
						return "far fa-file-alt";
					} else if (resource.resourceType === "Library") {
						return "fas fa-book-medical";
					} else if (resource.resourceType == "Questionnaire") {
						return "fas fa-question";
					}
					})();

                    if (i == State.get().bundle.pos) return;
					return (
					<Dropdown.Item
						onClick={(e) => {
                            this.handleClick.bind(this)(i, e);
                        }}
						key = {resource.id}
					>
						<span className={className} style={{marginRight:"10px"}}></span> {resource.title} | { resource.id}
					</Dropdown.Item>
					)}
				)}

                        </form>                        
                    </Col>
                </Row>
            </Container>
        )

    }
    
    render() {
        if (!this.props.show) {
            return null;
        }

        const title = "Select from existing resources in CPG";
        const content = this.renderResourceInput;

        return (
            <Modal show={true} onHide={this.handleClose.bind(this)} animation={false} size="lg">
                <Modal.Header closeButton={true}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{this.renderResourceInput()}</Modal.Body>
            </Modal>
        );
    }

}

export default SelectResourceDialog;