import React from 'react';
import State, { SageNodeInitializedFreezerNode } from "../state"
import * as SchemaUtils from "../helpers/schema-utils"
import { ACTIVITY_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faCaretRight} from  '@fortawesome/pro-solid-svg-icons';
import { CardEditor } from "./cardEditor";
import { QuestionnaireEditor } from "./questionnaireEditor/questionnaireEditor";
import { Library, PlanDefinition, PlanDefinitionActionCondition } from "fhir/r4";
import { buildFredId } from "../helpers/bundle-utils";
import { generateCqlFromConditions, makeCQLtoELMRequest } from "./cql-wizard/cql-generator";
import { exprToWizStateMap } from "./cql-wizard/wizardLogic";
import { useState } from "react";
import { ConditionEditor } from "./cql-wizard/conditionEditor";
import { useNavigate } from "react-router-dom";

interface PlanDefEditorProps {
    planDefNode: SageNodeInitializedFreezerNode,
    planDefPos: number,
}

export const PlanDefEditor = (props: PlanDefEditorProps) => {
    const navigate = useNavigate();

    const referencedNodeURI = getReferencedNodeURI(props.planDefNode);
    const [pdConditions, setPdConditions] = useState<PlanDefinitionActionCondition[]>(() => {
        // Read existing FHIR condition elements from plandefinition
        const planNodeResource = SchemaUtils.toFhir(props.planDefNode, false) as PlanDefinition;
        // Basic editor only supports a single action per PlanDefinition
        return planNodeResource.action?.[0]?.condition ?? [];
    })
    
    // All types of cards have identical requirements with respect to reading and writing conditions
    const conditionEditor = <ConditionEditor pdConditions={pdConditions} setPdConditions={setPdConditions} />
    
    function getEditorForURI(planDefNode: SageNodeInitializedFreezerNode, referencedURI: string): JSX.Element {
        const {
            node: linkedResourceNode,
            pos: linkedResourcePos
        } = getRelatedActivityNode(planDefNode);

        function handleCancelEdit() {
            navigate("/");
        }

        function handleSaveResource() {
            // Save new conditions PlanDefinition.action[0].condition
            const conditionNode = SchemaUtils.getChildOfNodePath(props.planDefNode, ["action", "condition"]);
            if (conditionNode) {
                State.emit("load_array_into", conditionNode, pdConditions);
            }

            /**
             * Generate a FHIR Library for the current conditions
             */
            const newLibraryUri = `http://somewhere.org/fhir/uv/mycontentig/Library/NEW-LIBRARY-GEN-${SchemaUtils.getNextId()}`;
            const newLibraryId = buildFredId();
            const newLibraryName = newLibraryUri;
            const newLibraryVersion = '1';
            // Save Library URL under PlanDefinition.Library
            const libraryNode = SchemaUtils.getChildOfNode(props.planDefNode, "library");
            if (libraryNode?.nodeType === "valueArray") { // In the regular FHIR spec, library has a cardinality 0..* so it's a valueArray.
                State.emit("load_array_into", libraryNode, [newLibraryUri]);
            }
            else if (libraryNode?.nodeType === "value") { // In the CPG spec, library has a cardinality of 0..1, so it's a value!
                State.emit("value_change", libraryNode, newLibraryUri);
            }
            // Send off asynchronous request to generate library
            State.get().simplified.generatedLibraries.set(newLibraryUri, {
                isGenerating: true,
                errorOccurred: false,
                fhirLibrary: {
                    resourceType: "Library",
                    id: newLibraryId,
                    url: newLibraryUri,
                    name: newLibraryName,
                    status: "draft",
                    type: {
                        coding: [{
                            system: "http://terminology.hl7.org/CodeSystem/library-type",
                            code: "logic-library",
                            display: "Logic Library"
                        }]
                    }
                }
            });

            // Call CQL translation function asynchronously, saving to bundle when finalized
            const draftConditions = pdConditions.flatMap(v => v.id && exprToWizStateMap[v.id] ? [exprToWizStateMap[v.id]] : [] )
            generateCqlFromConditions(draftConditions, newLibraryName, newLibraryVersion).then(async (cql) => {
                if (cql === null) {
                    console.log(`Error generating ${newLibraryName} version ${newLibraryVersion}`);
                    State.get().simplified.generatedLibraries.newLibraryUri?.set("errorOccurred", true);
                    State.get().simplified.generatedLibraries.newLibraryUri?.set("isGenerating", false);
                    return;
                }
                const b64Elm = await makeCQLtoELMRequest(cql);
                const libContent: Library['content'] = [];
                if (b64Elm === null) {
                    State.get().simplified.generatedLibraries.newLibraryUri?.set("errorOccurred", true);
                    libContent.push({
                        contentType: "application/cql",
                        data: window.btoa(cql),
                    });
                }
                else {
                    libContent.push({
                        contentType: "application/elm+json",
                        data: b64Elm,
                    });
                }
                State.get().simplified.generatedLibraries.newLibraryUri?.set("isGenerating", false);
                State.get().simplified.generatedLibraries.set(newLibraryUri, {
                    isGenerating: false,
                    errorOccurred: false,
                    fhirLibrary: {
                        resourceType: "Library",
                        url: newLibraryUri,
                        name: newLibraryName,
                        status: "active",
                        type: {
                            coding: [{
                                system: "http://terminology.hl7.org/CodeSystem/library-type",
                                code: "logic-library",
                                display: "Logic Library"
                            }]
                        },
                        content: libContent,
                    }
                });
            });
            
            /**
             * Finished saving resource, switch back to collection view
             */
             navigate("/");
        }
        
        switch (linkedResourceNode?.schemaPath) {
            case undefined:
                return (
                    <div>        
                        <button className="navigate col-lg-2 col-md-3" 
                            onClick={() => State.get().set("ui", {status:"collection"})}>
                            Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                        </button>
                        Referenced resource {referencedURI} does not exist in current Bundle
                    </div>
                );
            case ACTIVITY_DEFINITION:
                return <CardEditor actNode={linkedResourceNode} planNode={props.planDefNode} handleDeleteResource={handleCancelEdit} handleSaveResource={handleSaveResource} conditionEditor={conditionEditor} />
            case QUESTIONNAIRE:
                return <QuestionnaireEditor planDefNode={props.planDefNode} questionnareNode={linkedResourceNode} handleDeleteResource={handleCancelEdit}  handleSaveResource={handleSaveResource} conditionEditor={conditionEditor} />
            default:
                return (
                    <div>
                        <button className="navigate col-lg-2 col-md-3" 
                            onClick={() => State.get().set("ui", {status:"collection"})}>
                            Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                        </button>
                        <div>
                            Basic view does not support editing resources of type {linkedResourceNode?.schemaPath}
                        </div>
                    </div>
                );
        }
    }

    return (
        <div>
            {referencedNodeURI ? getEditorForURI(props.planDefNode, referencedNodeURI) :
            <div>
                <button className="navigate col-lg-2 col-md-3" 
                    onClick={() => State.get().set("ui", {status:"collection"})}>
                    Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                </button>
                Selected PlanDefinition has no action with a &quot;definitionCanonical&quot; -- cannot display in basic view
            </div>}
        </div>
    );
}

function getReferencedNodeURI(planDefNode: SageNodeInitializedFreezerNode) {
    return SchemaUtils.getChildOfNodePath(planDefNode, ["action", "definitionCanonical"])?.value;
}

export function getRelatedActivityNode(planDefNode: SageNodeInitializedFreezerNode): { node: any; pos: any; } {
    return SchemaUtils.findFirstSageNodeByUri(State.get().bundle.resources, getReferencedNodeURI(planDefNode));
}
