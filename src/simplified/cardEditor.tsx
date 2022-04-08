import { CodeableConcept } from "fhir/r4";
import React, { ElementType, useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import { OuterCardForm, textBoxProps, cardLayout, displayBoxProps } from "./outerCardForm";
import { ACTIVITY_DEFINITION, allFormElems, convertFormElementToObject, formElemtoResourceProp, FriendlyResourceFormElement, FriendlyResourceProps, getFormElementListForResource, PLAN_DEFINITION, profileToFriendlyResourceListEntry } from "./nameHelpers";
import { MedicationRequestForm } from "./medicationRequestForm";
import { fhirToFriendly } from '../simplified/nameHelpers';
import CodeableConceptEditor, { CodeableConceptEditorProps } from "./codeableConceptEditor";


interface ExpressionOptionDict {
    [expression: string]: ExpressionOption // The key is exactly what's written in the Condition's "expression" element
}
interface CardEditorProps {
    actNode: SageNodeInitializedFreezerNode,
    planNode: SageNodeInitializedFreezerNode,
    handleDeleteResource: () => void,
    handleSaveResource: () => void,
    conditionEditor: JSX.Element,
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
    conditionEditor: JSX.Element,
}
export interface pageThreeProps {
    displayElements: JSX.Element[],
}
export interface ICardForm {
    resourceType: FriendlyResourceProps;
    textBoxFields: Map<string, textBoxProps>;
    displayBoxFields: Map<string, displayBoxProps>;
    dropdownFields: Map<string, string[]>;
    codeableConceptFields: Map<string, Partial<CodeableConceptEditorProps>>;
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

/**
 * CodeableConcept as defined here https://www.hl7.org/fhir/datatypes.html#CodeableConcept
 * @param fieldName Name of element in `actNode` that is of type CodeableConcept
 * @param parentNode Node of parent element to `fieldName`
 * @returns \{ Name of field, Contents of field, (function) Set contents of field, (function) Save contents back into the SAGE node \}
 */
const codeableConceptCardField = (fieldName: string, parentNode: SageNodeInitializedFreezerNode) => {
    const fieldNode = SchemaUtils.getChildOfNodePath(parentNode, [fieldName]);

    // Normally dangerous
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [codeableConcept, setCodeableConcept] = useState<CodeableConcept>(() => {
        if (fieldNode) {
            // Initialize with existing value
            return SchemaUtils.toFhir(fieldNode, false)
        }
        return {}
    });
    
    function codeableConceptSaveHandler(name: string, contents: any, act: any, plan: any) {
        if (fieldNode) {
            State.emit("load_json_into", fieldNode, codeableConcept);
        }
        else {
            State.emit("load_json_into", parentNode, {
                [fieldName]: codeableConcept
            });
        }
    }
    return {
        fieldName,
        codeableConcept,
        setCodeableConcept,
        codeableConceptSaveHandler
    };
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
        <Form.Group className="page1-formgroup" key={fieldName + "-formGroup"} as={Col} controlId={fieldName}>
            <Row style={{margin: '0'}}>
                <Row style={{margin: '0', width: '100%'}}>
                    <Form.Label className="page1-input-fields-and-labels" key={fieldName + "-formLabel"} >{friendlyFieldName}</Form.Label>
                    <InputGroup className="page1-input-fields-and-labels">{returnVal()}</InputGroup>     
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
        <Form.Group className="page1-formgroup" key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Row style={{margin: '0'}}>
                <Form.Label className="page1-input-fields-and-labels" key={fieldName + "-label"}>{fieldFriendlyName}</Form.Label>
                <InputGroup className="page1-input-fields-and-labels" key={fieldName + "-inputGroup"}>
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
            </Row>
        </Form.Group>
    );
}

const createCodeableConceptElement = (fieldKey: string, fieldFriendlyName: string, codeableConceptEditorPropsOverrides: Partial<CodeableConceptEditorProps>, fieldHandlers: any[][], node: SageNodeInitializedFreezerNode): JSX.Element => {
    const { fieldName, codeableConcept, setCodeableConcept, codeableConceptSaveHandler } = codeableConceptCardField(fieldKey, node);
    fieldHandlers.push([fieldName, codeableConcept, setCodeableConcept, codeableConceptSaveHandler]);
    return (
        <Form.Group className="page1-formgroup" key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Row style={{margin: '0'}}>
                    <Form.Label className="page1-input-fields-and-labels" key={fieldName + "-label"}>{fieldFriendlyName}</Form.Label>
                    <div className="page1-input-fields-and-labels">
                    <CodeableConceptEditor {...codeableConceptEditorPropsOverrides} curCodeableConcept={codeableConcept} setCurCodeableConcept={setCodeableConcept} />
                    </div>
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

const createCodeableConceptElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    return friendlyFields
        .filter(ff => innerCardForm.codeableConceptFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createCodeableConceptElement(ff.SELF.FHIR, ff.SELF.FRIENDLY, innerCardForm.codeableConceptFields.get(ff.SELF.FHIR) ?? {}, fieldHandlers, node)
        })
}

const fieldElementListForType = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const flattenFriendlyFields = allFormElems(friendlyFields);
    return [
        ...createTextBoxElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
        ...createDropdownElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
        ...createCodeableConceptElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
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

    return (
        <div>
            <div key={actResourceType.FHIR + "-form"}  id="commonMetaDataForm">
                <OuterCardForm
                    sageNode={actNode}
                    fieldHandlers={fieldHandlers}
                    conditionEditor={props.conditionEditor}
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
        props.handleSaveResource();
    }

}

function CardStateEditor<T>(node: SageNodeInitializedFreezerNode, resourceName: string): [any, any] {
    return useState<T>(SchemaUtils.getChildOfNode(node, resourceName)?.value || "");
}
