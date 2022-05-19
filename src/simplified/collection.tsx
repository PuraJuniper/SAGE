import { faCaretLeft, faDownload } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Button, Col, Container } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import ExportDialog from '../dialogs/export-dialog';
import * as SchemaUtils from "../helpers/schema-utils";
import { SageNodeInitialized } from "../helpers/schema-utils";
import State from "../state";
import { BaseCard } from './baseCard';
import { AUTHOR_THEN_EXIT_ROUTE } from './basicView';
import { PLAN_DEFINITION, profileToFriendlyResourceListEntry } from "./nameHelpers";
import { CreateCardWorkflow } from './selectView';



const Collection = () => {
    const navigate = useNavigate();
    const resources = State.get().bundle?.resources ?? [];
    const [showExport, setShowExport] = useState(false);

    return (
        <Container className="p-5">
            <div className="row g-2">
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
            <div className="row box">
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
                            <button className="navigate w-100"
                                onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>
                                Edit Authoring Information
                            </button>}
                    </Col>
                {resources.length == 0 ? <div style={{ margin: "50px", marginTop: "40px" }}> <i>No Cards</i> </div> : undefined}
            </div>
            <ExportDialog show={showExport} bundle={State.get().bundle} handleClose={() => setShowExport(false)} />
        </Container>
    );
}

export default Collection