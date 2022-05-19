import { faCaretLeft, faDownload, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Button, Card, Col, Container } from 'react-bootstrap';
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



const SavedCards = () => {
    const navigate = useNavigate();
    const resources = State.get().bundle?.resources ?? [];
    const [showExport, setShowExport] = useState(false);

    return (
        <Container className="p-5">
            <div className="row">
                <h3 className="col-lg-8 col-md-6"><b>Saved Cards</b></h3>
                <Button variant='outline-primary' bsPrefix="card-btn btn" disabled>
                    New Folder
                </Button>
                <Button variant='outline-primary' bsPrefix="card-btn btn"
                    onClick={() => CreateCardWorkflow(navigate)}>
                    <FontAwesomeIcon icon={faCaretLeft} />
                    &nbsp;New Card
                </Button>
                <Button variant='outline-primary' bsPrefix="card-btn btn"
                    onClick={() => setShowExport(true)}>
                    <FontAwesomeIcon icon={faDownload} />
                    &nbsp;Export as FHIR Bundle
                </Button>
            </div>
            <div>
                <svg viewBox="0 0 1080 540">
                    <g>
                        <path fill="#2D2E74" strokeWidth={17} stroke="white"
                        d="m 530 60 h -295 l -37 -55 c -2 -3 -5 -5 -8 -5 h -180 c -6 0 -10 5 -10 10 v 60 v 40 v 290 c 0 28 22 50 50 50 h 1000 c 28 0 50 -22 50 -50 v -290 v -40 c 0 -6 -5 -10 -10 -10 z m -10 40 h -500 v -20 h 210 h 850 v 20 z m -500 -80 h 165 l 27 40 h -191 v -40 z m 1060 380 c 0 16 -13 30 -30 30 h -1000 c -16 0 -30 -13 -30 -30 v -280 h 1060 v 280 z" />

                    </g>
                <foreignObject width="100%" height="50%" y="50%">
                    <div style={{ color: "blue", textAlign: "center", fontSize: "20px" }}>Im a div inside a SVG.</div>
                    </foreignObject>
                </svg>
            </div>
            <Card bsPrefix='folder row card'>
                {
                    resources.reduce<{node: SageNodeInitialized, pos: number}[]>(
                        function (accumulator, currentValue, currentIndex, array) {
                            if (SchemaUtils.getResourceType(currentValue) === PLAN_DEFINITION) {
                                accumulator.push({
                                    node: currentValue,
                                    pos: currentIndex,
                                });
                            }
                            return accumulator;
                        }, []).map((planDefNodeAndPos, i) => {
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
                                        libraryUrls = SchemaUtils.getChildrenFromArrayNode(libraryNode).map(library=>library.value);
                                    }
                                    else if (libraryNode?.nodeType === "value") {
                                        if (libraryNode.value !== null && libraryNode.value !== undefined && libraryNode.value !== "") {
                                            libraryUrls = [libraryNode.value];
                                        }
                                    }
                                    return <div className="col-lg-3 col-md-4 col-sm-6" key={i*2}>   
                                        <BaseCard
                                            title={planTitleNode?.value ? planTitleNode.value : "Untitled PD"}
                                            header={profileToFriendlyResourceListEntry(SchemaUtils.toFhir(referencedNode, false).meta?.profile?.[0] ?? "")?.SELF.FRIENDLY ?? "Unknown"}
                                            hideHeader={false}
                                            onClick={() => navigate(`/edit/${planDefPos}`)}
                                            content={
                                                <Button className="col-6 w-100" variant="sage-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        State.emit("remove_from_bundle", planDefPos, referencedNodePos);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            }
                                        />
                                    </div>
                                }
                            }
                            // planDefNode has no defined definitionCanonical or the referenced FHIR Resource has not been loaded by SAGE (or doesn't exist)
                            return null;
                        })
                }

                    <Col lg="2" xs="3">
                        {
                            <>
                            <Button variant='outline-primary' bsPrefix="card-nav-btn btn"
                                onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>
                                Edit Authoring Information
                            </Button>
                        </> }
                    </Col>
                {resources.length == 0 ? <div style={{ margin: "50px", marginTop: "40px" }}> <i>No Cards</i> </div> : undefined}
            </Card>
            <ExportDialog show={showExport} bundle={State.get().bundle} handleClose={() => setShowExport(false)} />
        </Container>
    );
}

export default SavedCards