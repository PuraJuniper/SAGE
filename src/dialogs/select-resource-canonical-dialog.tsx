/* eslint-disable no-undef */
/* eslint-disable react/no-string-refs */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import {Container, Row, Col, Modal, Dropdown} from "react-bootstrap";
import State, { SageNodeInitializedFreezerNode, StateVars } from "../state";
import * as SchemaUtils from "../helpers/schema-utils"

interface SelectResourceDialogProps {
    show: boolean,
    bundle: NonNullable<StateVars['bundle']>,
    node: SageNodeInitializedFreezerNode,
    resourceTypeFilter: string[]
}

class SelectResourceDialog extends React.Component<SelectResourceDialogProps> {

    shouldComponentUpdate(nextProps: SelectResourceDialogProps) {
        return nextProps.show !== this.props.show;
    }

    renderResourceInput() {
        const resources = this.props.bundle.resources;
        const resourcesJson = [];
        const curResourceJson = SchemaUtils.toFhir(this.props.bundle.resources[this.props.bundle.pos], false);
        for (const resource of resources) {
            resourcesJson.push(SchemaUtils.toFhir(resource, false));
        }

        return (
            <Container>
                <Row className ="row">
                    <Col md="12">
                        <form className="navbar-form">

				{resourcesJson.map((resource, i) => {
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

                    if (resource.id == curResourceJson.id) return; // Do not show current resource
                    if (this.props.resourceTypeFilter && !this.props.resourceTypeFilter.includes(resource.resourceType)) return;
                    const disabled = resource.url ? false : true;
					
                    return (
                        <Dropdown.Item
                            disabled={disabled}
                            onClick={(e) => {
                                e.preventDefault();
                                State.emit("set_ui", "ready");
                                return State.emit("set_selected_canonical", this.props.node, i);
                            }}
                            key = {resource.id}
                        >
                            <span className={className} style={{marginRight:"10px"}}>
                            </span>
                            {resource.title} | {resource.id} {disabled ? <i>(Resource has no URI, cannot be selected)</i> : ""}
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
            <Modal show={true} onHide={()=>State.emit("set_ui", "ready")} animation={false} size="lg">
                <Modal.Header closeButton={true}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{this.renderResourceInput()}</Modal.Body>
            </Modal>
        );
    }

}

export default SelectResourceDialog;