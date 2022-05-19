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
            <Card bsPrefix='folder row card'>
                <div>
                    <svg x="0px" y="0px" viewBox="0 0 54 54" >
                        <g>
                            <path d="M53,10.5H23.535l-3.703-5.555C19.646,4.667,19.334,4.5,19,4.5H1c-0.552,0-1,0.447-1,1v6v4v29.003
		C0,47.259,2.24,49.5,4.994,49.5h44.012C51.76,49.5,54,47.259,54,44.503V15.5v-4C54,10.947,53.552,10.5,53,10.5z M52,14.5H2v-2h21
		h29V14.5z M2,6.5h16.465l2.667,4H2V6.5z M52,44.503c0,1.652-1.343,2.997-2.994,2.997H4.994C3.343,47.5,2,46.155,2,44.503V16.5h50
		V44.503z"/>

                        </g>
                        <foreignObject width="100%" height="100%">
                            <div style={{color: "blue",margin: "25% auto 5% auto",textAlign: "center", fontSize:"5px"}}>Im a div inside a SVG.</div>
                        </foreignObject>
                    </svg>
                </div>
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