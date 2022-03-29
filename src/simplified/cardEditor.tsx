import * as cql from "cql-execution";
import { Library, Dosage, PlanDefinition, PlanDefinitionActionCondition } from "fhir/r4";
import { ExtractTypeOfFN } from "freezer-js";
import React, { ElementType, useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import hypertensionLibraryJson from "../../public/samples/hypertension-library.json";
import * as SageUtils from "../helpers/sage-utils";
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import { OuterCardForm, textBoxProps, cardLayout, displayBoxProps } from "./outerCardForm";
import { ACTIVITY_DEFINITION, allFormElems, convertFormElementToObject, formElemtoResourceProp, FriendlyResourceFormElement, FriendlyResourceProps, getFormElementListForResource, PLAN_DEFINITION, profileToFriendlyResourceListEntry } from "./nameHelpers";
import { MedicationRequestForm, SageCondition } from "./medicationRequestForm";
import { buildEditableStateFromCondition, WizardState } from "./cql-wizard/wizardLogic";
import { generateCqlFromConditions, makeCQLtoELMRequest } from "./cql-wizard/cql-generator";
import { buildFredId } from "../helpers/bundle-utils";
import { fhirToFriendly } from '../simplified/nameHelpers';



const hypertensionLibrary: Library = hypertensionLibraryJson as Library;

interface ExpressionOptionDict {
    [expression: string]: ExpressionOption // The key is exactly what's written in the Condition's "expression" element
}
interface CardEditorProps {
    actNode: SageNodeInitializedFreezerNode,
    planNode: SageNodeInitializedFreezerNode,
    handleDeleteResource: () => void,
}
interface ExpressionOption {
    expressionInLibrary: string,
    libraryIdentifier: string,
    libraryUrl: string,
}

export interface pageOneProps {
    fieldElements: JSX.Element[],
}

export interface pageTwoProps {
    draftConditions: EditableStateForCondition[],
    persistEditedCondition: (newConditionState: EditableStateForCondition) => void,
    generateNewCondition: () => EditableStateForCondition,
}
export interface pageThreeProps {
    displayElements: JSX.Element[],
}
export interface ICardForm {
    resourceType: FriendlyResourceProps;
    textBoxFields: Map<string, textBoxProps>;
    displayBoxFields: Map<string, displayBoxProps>;
    dropdownFields: Map<string, string[]>;
    resourceFields: string[];
    cardFieldLayout: cardLayout;
    pageOne: React.FunctionComponent<pageOneProps> | React.ComponentClass<pageOneProps>;
    pageTwo: React.FunctionComponent<pageTwoProps> | React.ComponentClass<pageTwoProps>;
    pageThree: React.FunctionComponent<pageThreeProps> | React.ComponentClass<pageThreeProps>;
}

const simpleCardField = (fieldName: string, actNode: SageNodeInitializedFreezerNode) => {
    const [fieldContents, setField] = CardStateEditor<string>(actNode, fieldName);
    function fieldSaveHandler(name: string, contents: any, act: any, plan: any) {
        const fieldNode = SchemaUtils.getChildOfNodePath(plan, ["action", name]);
        if (fieldNode) {
            State.emit("value_change", fieldNode, name, false);
        }
        if (act.displayName == ACTIVITY_DEFINITION) {
            State.emit("value_change", SchemaUtils.getChildOfNode(act, name), contents, false);
        }
        State.emit("value_change", SchemaUtils.getChildOfNode(plan, name), contents, false);
    }
    return [fieldName, fieldContents, setField, fieldSaveHandler]
}


const createTextBoxElement = (fieldKey: string, friendlyFieldName: string, textProps: textBoxProps, fieldHandlers: any[][], node: SageNodeInitializedFreezerNode): JSX.Element => {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, node);
    function validURL(urlInput: string) {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(urlInput);
    }

    function returnVal() {
        if (textProps.isLink) {
            return <Button key={fieldName + "-button"} variant="link" onClick={() => window.open(fieldContents)}>{fieldContents}</Button>;
        } else {
            return <Form.Control key={fieldName + "-formControl"} className= {(fieldName == "resource") ? (((fieldContents == "")||validURL(fieldContents)) ? "" : "is-invalid") : ""}
                {...{
                    ...(textProps.isReadOnly) && { readOnly: textProps.isReadOnly },
                    ...(textProps.boxSize) > 1 && { as: "textarea" as ElementType<any>, rows: textProps.boxSize },
                    ...{
                        type: "text",
                        defaultValue: fieldContents,
                        onChange: (e: { currentTarget: { value: any; }; }) => setField(e.currentTarget.value)
                    }
                }} />;
        }
    }
    fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
    return (
        <Form.Group key={fieldName + "-formGroup"} as={Col} controlId={fieldName}>
            <Row className="page1-row-element">
                <Row className="page1-label-and-input">
                    <Form.Label key={fieldName + "-formLabel"} >{friendlyFieldName}</Form.Label>
                    <Col className = 'page1-input-fields' key={fieldName + "-col"}>
                            {returnVal()}
                    </Col>
                </Row>
                <Form.Text key={fieldName + "-formText"}>{textProps.caption}</Form.Text>
            </Row>
        </Form.Group>
    );
}

const createDropdownElement = (fieldKey: string, fieldFriendlyName: string, fieldElements: string[], fieldHandlers: any[][], node: SageNodeInitializedFreezerNode): JSX.Element => {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, node);
    fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
    
    return (
        <Form.Group key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Row className="page1-row-element">
                <Form.Label key={fieldName + "-label"}>{fieldFriendlyName}</Form.Label>
                <Col key={fieldName + "-col"} className = 'page1-input-fields'>
                    <InputGroup key={fieldName + "-inputGroup"}>
                        <Form.Control
                            key={fieldName + "formControl"}
                            as="select"
                            defaultValue = {fieldContents}
                            onChange={(e) => setField(e.currentTarget.value)}
                        >
                            <option hidden disabled value=''>{'--Please Select an Option--'}</option>
                            {fieldElements.map((sType) => {
                                return <option key={fieldKey + "-" + sType} value={sType}>{sType}</option>;
                            })}
                        </Form.Control>
                    </InputGroup>
                </Col>
            </Row>
        </Form.Group>
    );
}

const createDisplayElement = ( displayProps: displayBoxProps,friendlyFields: any,fieldHandlers: any, i: number): JSX.Element => {
    let friendly;
    for (let j = 0; j < friendlyFields.length; j++) {
        if(friendlyFields[j].SELF.FHIR === fieldHandlers[i][0]){
            friendly = friendlyFields[j].SELF.FRIENDLY
        }
    }
    if (displayProps.displayFieldTitle === true){
        return (
            <Form.Group key={fieldHandlers[i][0] + "-fromGroup"} as={Col} controlId={fieldHandlers[i][0]} className = {displayProps.className}>
                <Form.Label key={fieldHandlers[i][0] + "-label"} > <b>{friendly}</b> {fieldHandlers[i][1]}</Form.Label>
            </Form.Group>
        )
    }
    else{
        return (
            <Form.Group key={fieldHandlers[i][0] + "-fromGroup"} as={Col} controlId={fieldHandlers[i][0]}>
                <Form.Label key={fieldHandlers[i][0] + "-label"} className = {displayProps.className}>{fieldHandlers[i][1]}</Form.Label>
            </Form.Group>
        )
    }
   
}

const createDisplayElementList = (innerCardForm: ICardForm,fieldHandlers: any, resourceType: FriendlyResourceProps): JSX.Element[] => {
    const friendlyFields = getFormElementListForResource(resourceType.FHIR);
    const flattenFriendlyFields = allFormElems(friendlyFields);
    const defaultBoxProps: displayBoxProps = {className: "", displayFieldTitle: true }

    const list: JSX.Element[] = [];
    for (let i = 0; i < fieldHandlers.length; i++) {
        list[i] = createDisplayElement(innerCardForm.displayBoxFields.get(fieldHandlers[i][0])?? defaultBoxProps,
        flattenFriendlyFields,fieldHandlers, i);
    }

    return list;
}

const createTextBoxElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const defaultBoxProps: textBoxProps = { boxSize: 1, isReadOnly: false, isLink: false, caption: "" }
    return friendlyFields
        .filter(ff => innerCardForm.textBoxFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createTextBoxElement(ff.SELF.FHIR, ff.SELF.FRIENDLY,
                innerCardForm.textBoxFields.get(ff.SELF.FHIR) ?? defaultBoxProps, fieldHandlers, node)
        });
}

const createDropdownElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    return friendlyFields
        .filter(ff => innerCardForm.dropdownFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createDropdownElement(ff.SELF.FHIR, ff.SELF.FRIENDLY, innerCardForm.dropdownFields.get(ff.SELF.FHIR) ?? [], fieldHandlers, node)
        })
}

const fieldElementListForType = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const flattenFriendlyFields = allFormElems(friendlyFields);
    return [
        ...createTextBoxElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
        ...createDropdownElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node)
    ]
}

// Returns a new inner card form instance for the given resource type
function actTypeToICardForm(actResourceType: FriendlyResourceProps) {
    switch (actResourceType.FHIR) {
        case "MedicationRequest":
            return new MedicationRequestForm(actResourceType)

        default: 
            return new MedicationRequestForm(actResourceType)
    }
}

// Returns the resource type of the given SageNode
function getResourceType(actNode: SageNodeInitializedFreezerNode): FriendlyResourceProps {
    const resourceProfile = (): string => {
        const fhirResource = SchemaUtils.toFhir(actNode, false);
        const meta = fhirResource ? fhirResource.meta : undefined;
        const profile = meta ? meta.profile : undefined;
        return profile ? profile[0] : "";
    };
    return formElemtoResourceProp(profileToFriendlyResourceListEntry(resourceProfile()));
}

/**
 * Types required for the condition editor
 */
export enum AggregateType {
    Exists = "exists",
    DoesNotExist = "doesNotExist",
    AtLeast = "atLeast",
    NoMoreThan = "noMoreThan"
}
export interface WizExprAggregate {
    aggregate: AggregateType,
    count?: number,
}
// An editable state for the Condition with id `conditionId`
export interface EditableStateForCondition {
    curWizState: WizardState | null,
    exprAggregate: WizExprAggregate,
    conditionId: string,
}

/**
 * This component reads data from and creates callbacks to write data into the given resource nodes
 * The callbacks and data are passed to the generic ActivityDefinition editor component (OuterCardForm)
 * @param props: A PlanDefinition node and an ActivityDefinition node
 * @returns An OuterCardForm for the given PD+AD
 */
export const CardEditor = (props: CardEditorProps) => {
    const actNode = props.actNode;
    const planNode = props.planNode;
    const fieldHandlers: any[][] = [];

    /**
     * Derive the resource type and ICardForm based on props.actNode to pass down to the OuterCardForm
     * Note: setState and useEffect are used here because a new Object and ICardForm instance is created 
     *  by each getResourceType() and actTypeToICardForm() call respectively, so we must only derive them
     *  conditionally to avoid causing OuterCardForm to re-render unconditionally
     */
    const [actResourceType, setActResourceType] = useState<FriendlyResourceProps>(() => getResourceType(actNode));
    const [innerCardForm, setInnerCardForm] = useState<ICardForm>(() => actTypeToICardForm(actResourceType));
    useEffect(() => {
        const newActResourceType = getResourceType(actNode);
        setActResourceType(newActResourceType);
        setInnerCardForm(actTypeToICardForm(newActResourceType));
    }, [actNode])

    /**
     * Read PD conditions into a format editable by the condition editor
     * All types of cards have identical requirements with respect to reading and writing conditions, 
     *  so it's safe for this component to have complete ownership of the PD's condition edit state
     */
    const [draftConditions, setDraftConditions] = useState<EditableStateForCondition[]>(()=>{
        // Read existing FHIR condition elements from plandefinition
        const planNodeResource = SchemaUtils.toFhir(planNode, false) as PlanDefinition;
        // Basic editor only supports a single action per PlanDefinition
        const pdConditions: PlanDefinitionActionCondition[] = planNodeResource.action?.at(0)?.condition ?? [];

        // Set ids for each condition, if one does not already exist
        const pdSageConditions: SageCondition[] = pdConditions.map((v, i) => {
            return {
                ...v,
                id: v.id ?? `index-${SchemaUtils.getNextId()}`, // Need some unique id
            }
        });

        // Return each condition as a format compatible with the condition editor
        return pdSageConditions.map(v=>buildEditableStateFromCondition(v))
    });
    /**
     * Create callbacks for persisting edits to a condition and for generating a brand new condition
     */
    const persistEditedCondition = (newConditionState: EditableStateForCondition) => {
        setDraftConditions(curEditableConditions => {
            if (!curEditableConditions.some(v=>v.conditionId === newConditionState.conditionId)) {
                // Condition is brand new, add to our draft conditions
                return curEditableConditions.concat([newConditionState])
            }
            else {
                // Condition already exists in drafts, so update its draft
                return curEditableConditions.map(v => (v.conditionId !== newConditionState.conditionId) ? v : newConditionState)
            }
        });
    }
    const generateEditableCondition = (): EditableStateForCondition => { // Creating a new condition with default values
        return {
            curWizState: null,
            exprAggregate: {
                aggregate: AggregateType.Exists,
            },
            conditionId: `index-${SchemaUtils.getNextId()}`, // Need some unique id
        };
    }

    return (
        <div>
            <div key={actResourceType.FHIR + "-form"} style={{ color: "#2a6b92" }} id="commonMetaDataForm">
                <OuterCardForm
                    sageNode={actNode}
                    fieldHandlers={fieldHandlers}
                    draftConditions={draftConditions}
                    persistEditedCondition={persistEditedCondition}
                    generateNewCondition={generateEditableCondition}
                    resourceType={actResourceType}
                    elementList={fieldElementListForType(innerCardForm, getFormElementListForResource(innerCardForm.resourceType.FHIR), fieldHandlers, actNode)}
                    displayList={createDisplayElementList(innerCardForm,fieldHandlers, actResourceType)}
                    innerCardForm={innerCardForm}
                    handleSaveResource={handleSaveResource}
                    handleDeleteResource={props.handleDeleteResource}
                />
            </div>
        </div>
    );

    /**
     * Callback to write changes from the editor into the freezer-js state and return to the collection view
     */
    async function handleSaveResource() {
        fieldHandlers.forEach((field) => field[3](field[0], field[1], actNode, planNode));

        /**
         * Save conditions to PlanDefinition
         * Drops any previously-existing conditions that could not be read by our condition editor
         */
        const newConditions: PlanDefinitionActionCondition[] = draftConditions.map(v => {
            return {
                id: v.conditionId,
                expression: {
                    language: "text/cql",
                    expression: v.conditionId,
                },
                kind: "applicability"
            }
        });
        // Save new conditions array under PlanDefinition.action.condition
        const conditionNode = SchemaUtils.getChildOfNodePath(planNode, ["action", "condition"]);
        if (conditionNode) {
            State.emit("load_array_into", conditionNode, newConditions);
        }
        // Save Library URL (stored as an array in FHIR) under PlanDefinition.Library
        const newLibraryUri = `http://somewhere.org/fhir/uv/mycontentig/Library/NEW-LIBRARY-GEN-${SchemaUtils.getNextId()}`;
        const newLibraryId = buildFredId();
        const newLibraryName = newLibraryUri;
        const newLibraryVersion = '1';
        const libraryNode = SchemaUtils.getChildOfNode(planNode, "library");
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
        State.get().set("ui", { status: "collection" });
    }

}

function CardStateEditor<T>(node: SageNodeInitializedFreezerNode, resourceName: string): [any, any] {
    return useState<T>(SchemaUtils.getChildOfNode(node, resourceName)?.value || "");
}
