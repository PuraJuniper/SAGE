import React from 'react';
import { useState, useEffect } from "react";
import { Folder } from "./folder";
import State, { SageReactions } from "../state";
import * as SchemaUtils from "../helpers/schema-utils"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCaretLeft } from '@fortawesome/pro-solid-svg-icons';
import { SageNodeInitialized } from "../helpers/schema-utils";
import { PLAN_DEFINITION } from "./nameHelpers";
import { useNavigate } from "react-router-dom";


const Collection = () => {
    const navigate = useNavigate();
    const resources = State.get().bundle?.resources ?? [];

    return (
        <div>
            <div className="row">
                <h3 className="col-lg-10 col-md-9"><b>Saved Cards</b></h3>
                <button className="navigate-reverse col-lg-2 col-md-3"
                    onClick={() => navigate('/basic-home')}>
                    <FontAwesomeIcon icon={faCaretLeft} />
                    &nbsp;New Card
                </button>
                <button className="navigate-reverse col-lg-2 col-md-2"
                    onClick={() => State.get().set("ui", { status: "export" })}>
                    <FontAwesomeIcon icon={faDownload} />
                    &nbsp;Export as FHIR Bundle
                </button>
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
                                    const planTitleNode = SchemaUtils.getChildOfNode(planDefNode, "title");
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
                                        <Folder
                                            actTitle={actTitleNode?.value ? actTitleNode.value : "Untitled AD"}
                                            planTitle={planTitleNode?.value ? planTitleNode.value : "Untitled PD"}
                                            actDesc={actDescNode?.value ? actDescNode.value : ""}
                                            conditionExpressions={conditionExpressions}
                                            referencedLibraries={libraryUrls}
                                            profile={SchemaUtils.toFhir(referencedNode, false).meta?.profile?.[0] ?? ""}
                                            wait={i * 25}
                                            pdIndex={planDefPos}
                                            refIndex={referencedNodePos}
                                        />
                                    </div>
                                }
                            }
                            // planDefNode has no defined definitionCanonical or the referenced FHIR Resource has not been loaded by SAGE (or doesn't exist)
                            return null;
                        })
                }
                {resources.length == 0 ? <div style={{ margin: "50px", marginTop: "40px" }}> <i>No Cards</i> </div> : undefined}
            </div>
        </div>
    );
}

export default Collection