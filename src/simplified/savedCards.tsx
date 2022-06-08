import { faCaretLeft, faDownload, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Button, Card, Col, Container, ListGroup, ListGroupItem, Modal, Nav, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import ExportDialog from '../dialogs/export-dialog';
import * as SchemaUtils from "../helpers/schema-utils";
import { SageNodeInitialized } from "../helpers/schema-utils";
import State from "../state";
import { BaseCard } from './baseCard';
import { AUTHOR_THEN_EXIT_ROUTE } from './basicView';
import { Folder } from './folder';
import { PLAN_DEFINITION, profileToFriendlyResourceListEntry } from "./nameHelpers";
import { CreateCardWorkflow } from './selectView';



export const CardTabTitle = (text: string, backgroundColor: string) => <Nav
    as={"header"} variant="tabs" defaultActiveKey="#disabled" style={{ borderBottomColor: "inherit", borderBottomWidth: "inherit", marginTop: '1rem' }}>
    <Nav.Item style={{backgroundColor: backgroundColor, borderBottomColor: "inherit" }}>
        <Nav.Link href="#disabled" disabled style={{
            color: "var(--sage-dark-purple)", backgroundColor: "transparent", borderColor: "inherit",
            borderBottomColor: "inherit", zIndex: "+1", marginBottom: "-2px", borderBottomWidth: "2px",
            position: "relative", borderBottomLeftRadius: "3px", borderWidth: "2px", borderTopLeftRadius: "15px", borderTopRightRadius: "15px"
        }}>
            {text}
        </Nav.Link>
    </Nav.Item>
</Nav>;
const SavedCards = () => {
    const navigate = useNavigate();
    const resources = State.get().bundle?.resources ?? [];
    const savedCards = resources.reduce<{ node: SageNodeInitialized, pos: number }[]>(
        function (accumulator, currentValue, currentIndex, array) {
            if (SchemaUtils.getResourceType(currentValue) === PLAN_DEFINITION) {
                accumulator.push({
                    node: currentValue,
                    pos: currentIndex,
                });
            }
            return accumulator;
        }, []);
    const [showExport, setShowExport] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(Array(savedCards.length).fill(false))

    return (
        <Container>
            <h3 className="col-lg-8 col-md-6"><b>Saved Cards</b></h3>
            <Row>
                <Col md={3} style={{ textAlign: "left" }}>
                    <Button variant='outline-primary' bsPrefix="card-btn btn"
                        onClick={() => setShowExport(true)}>
                        <FontAwesomeIcon icon={faDownload} />
                        &nbsp;Export as FHIR Bundle
                    </Button>
                </Col>
                <Col md={{ offset: "6" }} style={{ textAlign: "right" }}>
                    <Row>
                        <Col>
                            <Button variant='outline-primary' bsPrefix="card-btn btn" disabled>
                                New Folder
                            </Button>
                        </Col>
                        <Col>
                            <Button variant='outline-primary' bsPrefix="card-btn btn"
                                onClick={() => CreateCardWorkflow(navigate)}>
                                <FontAwesomeIcon icon={faCaretLeft} />
                                &nbsp;New Card
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Card style={{ borderStyle: "hidden", borderColor: "var(--sage-dark-purple)"}}>
                <span style={{borderBottomColor: "white", borderBottomWidth:"2px"}}> {CardTabTitle(State.get().author.authorings[State.get().author.pos].CPGName, "white")}</span>
                <Card.Body style={{ borderStyle: "solid", borderWidth: "2px", borderRadius: "25px", borderTopLeftRadius: "unset", borderColor: "inherit" }}>
                    <ListGroup>
                        <ListGroupItem style={{ borderStyle: "unset" }}>
                            <Col style={{ textAlign: "right" }}>
                                <Button variant='outline-primary' bsPrefix="card-btn btn"
                                    onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>
                                    Edit Authoring Information
                                </Button>
                            </Col>
                        </ListGroupItem>
                        <Row>
                            {
                                savedCards.map((planDefNodeAndPos, i: number) => {
                                    const { node: planDefNode, pos: planDefPos } = planDefNodeAndPos;
                                    // Find SageNode for FHIR Resource referenced in planDefNode's definitionCanonical
                                    const referencedNodeURI = SchemaUtils.getChildOfNodePath(planDefNode, ["action", "definitionCanonical"])?.value;
                                    if (referencedNodeURI) {
                                        const {
                                            node: referencedNode,
                                            pos: referencedNodePos,
                                        } = SchemaUtils.findFirstSageNodeByUri(State.get().bundle.resources, referencedNodeURI);
                                        if (referencedNode) {
                                            const actTitleNode = SchemaUtils.getChildOfNode(referencedNode, "title");
                                            const planTitleNode = SchemaUtils.getChildOfNodePath(planDefNode, ["title"]);
                                            const actDescNode = SchemaUtils.getChildOfNode(referencedNode, "description");
                                            // Get all CQL expressions
                                            const conditionNode = SchemaUtils.getChildOfNodePath(planDefNode, ["action", "condition"]);
                                            let conditionExpressions: string[] = [];
                                            if (conditionNode) {
                                                conditionExpressions = SchemaUtils.getChildrenFromArrayNode(conditionNode).flatMap(condition => {
                                                    const expressionStrNode = SchemaUtils.getChildOfNodePath(condition, ['expression', 'expression']);
                                                    return expressionStrNode ? [expressionStrNode.value] : []
                                                })
                                            }
                                            // Get URL of each referenced Library
                                            let libraryUrls: string[] = [];
                                            const libraryNode = SchemaUtils.getChildOfNodePath(planDefNode, ['library']);
                                            if (libraryNode?.nodeType === "valueArray") {
                                                libraryUrls = SchemaUtils.getChildrenFromArrayNode(libraryNode).map(library => library.value);
                                            }
                                            else if (libraryNode?.nodeType === "value") {
                                                if (libraryNode.value !== null && libraryNode.value !== undefined && libraryNode.value !== "") {
                                                    libraryUrls = [libraryNode.value];
                                                }
                                            }
                                            const cardTitle = planTitleNode?.value ? planTitleNode.value : "Untitled PD";

                                            return (
                                                <Col md={3} style={{ paddingBottom: "calc(var(--bs-gutter-x) * .5)" }}>
                                                    <BaseCard
                                                        title={cardTitle}
                                                        header={profileToFriendlyResourceListEntry(SchemaUtils.toFhir(referencedNode, false).meta?.profile?.[0] ?? "")?.SELF.FRIENDLY ?? "Unknown"}
                                                        hideHeader={false}
                                                        onClick={() => navigate(`/edit/${planDefPos}`)}
                                                        bsBg={"sage-grey"}
                                                        content={
                                                            <Button variant='outline-primary' bsPrefix="card-btn btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowDeleteModal(showDeleteModal.map((val, j) => {return i === j ? true : val;}));}}
                                                            >
                                                                Delete
                                                            </Button>
                                                        }
                                                    />
                                                    <Modal show={showDeleteModal[i]} size="sm">
                                                        <Modal.Header className="justify-content-md-center">
                                                            Delete {cardTitle}?
                                                        </Modal.Header>
                                                        <Modal.Body>
                                                            <button key="butDelete" className="btn btn-secondary" type="button"
                                                                onClick=
                                                                {(e) => {
                                                                    e.stopPropagation();
                                                                    State.emit("remove_from_bundle", planDefPos, referencedNodePos);
                                                                    showDeleteModal.splice(i, 1)
                                                                }}>
                                                                Yes, delete it
                                                            </button>
                                                            <button key="butCancel" className="btn btn-tertiary" style={{ float: "right" }} type="button"
                                                                onClick={() => setShowDeleteModal(showDeleteModal.map(val => { return val === true ? false : val;})) }>
                                                                No
                                                            </button>
                                                        </Modal.Body>
                                                    </Modal>
                                                </Col>

                                            )
                                        }
                                    }
                                    // planDefNode has no defined definitionCanonical or the referenced FHIR Resource has not been loaded by SAGE (or doesn't exist)
                                    return null;
                                })
                            }
                        </Row>
                    </ListGroup>
                    {resources.length == 0 ?
                        <Row style={{ paddingTop: "60px" }}>
                            <Col md={{ offset: "5" }}> <h5><i>No Cards</i></h5> </Col>
                        </Row>
                        : undefined}
                </Card.Body>
            </Card>
            <ExportDialog show={showExport} bundle={State.get().bundle} handleClose={() => setShowExport(false)} />
        </Container>
    );
}

export default SavedCards