import { faInfoCircle } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CodeableConcept } from "fhir/r4";
import React, { Dispatch, ElementType, SetStateAction, useEffect, useState } from "react";
import { Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import CodeableConceptEditor, { CodeableConceptEditorProps } from "./codeableConceptEditor";
import { MedicationRequestForm } from "./medicationRequestForm";
import { ACTIVITY_DEFINITION, allFormElems, formElemtoResourceProp, FriendlyResourceFormElement, FriendlyResourceProps, getFormElementListForResource, profileToFriendlyResourceListEntry } from "./nameHelpers";
import { cardLayout, previewProps, dropdownBoxProps, fieldFormProps, invisibleFieldProps, OuterCardForm, textBoxProps } from "./outerCardForm";


interface ExpressionOptionDict {
    [expression: string]: ExpressionOption // The key is exactly what's written in the Condition's "expression" element
}
interface CardEditorProps {
    actNode: SageNodeInitializedFreezerNode,
    planNode: SageNodeInitializedFreezerNode,
    handleExit: () => void,
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
    // displayBoxFields: Map<string, previewProps>;
    dropdownFields: Map<string, dropdownBoxProps>;
    invisibleFields: Map<string, invisibleFieldProps>; 
    codeableConceptFields: Map<string, Partial<CodeableConceptEditorProps>>;
    resourceFields: string[];
    cardFieldLayout: cardLayout;
    pageOne: React.FunctionComponent<pageOneProps> | React.ComponentClass<pageOneProps>;
    pageTwo: React.FunctionComponent<pageTwoProps> | React.ComponentClass<pageTwoProps>;
    pageThree: React.FunctionComponent<pageThreeProps> | React.ComponentClass<pageThreeProps>;
}

// { fieldName: string; 
//     codeableConcept: CodeableConcept;
//      setCodeableConcept: React.Dispatch<React.SetStateAction<CodeableConcept>>; 
//      codeableConceptSaveHandler: (name: string, contents: any, act: any, plan: any);
// }
export interface FieldHandlerProps {
    fieldName: string,
    fieldContents: any,
    fieldAncestry: string[],
    setField: Dispatch<SetStateAction<any>>
    fieldSaveHandler: (name: string, contents: any, act: any, plan: any, fieldAncestry: string[]) => void
    otherFieldChangeTriggerFn?: (changedField: string, fieldValue: string, fieldHandlers: Map<string, FieldHandlerProps>, requiredField?: string) => string
}
export function planFieldSaveHandler(plan: SageNodeInitializedFreezerNode, name: string, contents: any) {
    State.emit("value_change", SchemaUtils.getChildOfNode(plan, name), contents, false);
}

export function activityFieldSaveHandler(act: SageNodeInitializedFreezerNode, name: string, contents: any, fieldAncestry?: string[] | undefined) {
    const changedNode = fieldAncestry ? SchemaUtils.getChildOfNodePath(act, [...fieldAncestry, name]) : SchemaUtils.getChildOfNode(act, name);
    State.emit("value_change", changedNode, contents, false);
}

export function fieldSaveHandler(name: string, contents: any, act: SageNodeInitializedFreezerNode, plan: SageNodeInitializedFreezerNode, fieldAncestry?: string[]) {
    const fieldNode = SchemaUtils.getChildOfNodePath(plan, ["action", name]);
    if (fieldNode) {
        State.emit("value_change", fieldNode, contents, false);
    }
    if (act.displayName == ACTIVITY_DEFINITION) {
        activityFieldSaveHandler(act, name, contents, fieldAncestry);
    }
    planFieldSaveHandler(plan, name, contents);
}

const simpleCardField = (fieldName: string, actNode: SageNodeInitializedFreezerNode, fieldAncestry: string[]) => {
    const [fieldContents, setField] = CardStateEditor<string>(actNode, fieldName, fieldAncestry);
    return [fieldName, fieldContents, setField, fieldSaveHandler, fieldAncestry]
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

const createTextBoxElement = (friendlyField: FriendlyResourceProps, textProps: textBoxProps, fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element => {
    const fieldKey: string = friendlyField.FHIR;
    const friendlyFieldName: string = friendlyField.FRIENDLY;
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, node, friendlyField.PARENTS ?? []);
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
                    ...(textProps.isReadOnly) && { readOnly: textProps.isReadOnly},
                    ...(textProps.boxSize) > 1 && { as: "textarea" as ElementType<any>, rows: textProps.boxSize },
                    ...{
                        type: "text",
                        defaultValue: fieldContents,
                        onChange: (e: { currentTarget: { value: any; }; }) => {
                            setField(e.currentTarget.value);
                            if (!textProps.isReadOnly) {
                                changeDependantFields(fieldName, e.currentTarget.value, textProps, fieldHandlers);
                            }
                        }
                    }
                }} />;
        }
    }
    fieldHandlers.set(fieldName, { fieldName, fieldContents, fieldAncestry: friendlyField.PARENTS ?? [], setField, fieldSaveHandler, otherFieldChangeTriggerFn: textProps.otherFieldTriggerFn })
    if((fieldName == 'period' || fieldName == 'frequency' || fieldName == 'duration')){
        return(
        <Form.Group className={textProps.className} key={fieldName + "-formGroup"}  controlId={fieldName}>
            <div style={{'display':'flex', 'flexDirection': 'row'}} >
                <Form.Text key={fieldName + "-formText"}>{textProps.caption}</Form.Text>
                <InputGroup >{returnVal()}</InputGroup>  
            </div>
        </Form.Group>
        )
    }
    if (fieldName != "resource") {
        textProps.hideFieldToolTip = true;
    }
    return (
        <Form.Group className= "page1-formgroup" key={fieldName + "-formGroup"} as={Col} controlId={fieldName}>
            <div>
                <Form.Label hidden={(textProps.hideFieldTitle == true) ? true:false} key={fieldName + "-formLabel"} >
                    {friendlyFieldName}
                </Form.Label>
                <div hidden={(textProps.hideFieldToolTip == true) ? true:false} className="page1-tooltip float-end">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <Card className="page1-tooltiptext">
                        <div>{textProps.caption}</div>
                    </Card>
                </div>
            </div>
            <div>
                <InputGroup className={`${textProps.className}`}>{returnVal()}</InputGroup>
            </div>
        </Form.Group>
    );
}

const createDropdownElement = (friendlyField: FriendlyResourceProps, fieldElements: dropdownBoxProps, fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element => {
    const fieldKey: string = friendlyField.FHIR;
    const friendlyFieldName: string = friendlyField.FRIENDLY;
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, node, friendlyField.PARENTS ?? []);
    fieldHandlers.set(fieldName, { fieldName, fieldContents, fieldAncestry: friendlyField.PARENTS ?? [], setField, fieldSaveHandler, otherFieldChangeTriggerFn: fieldElements.otherFieldTriggerFn })
    
    if(fieldName == 'periodUnit' || fieldName == 'durationUnit'){
        return(
            <Form.Group className='page1-dosage-medium' key={fieldName + "-fromGroup"} controlId={fieldKey}>
                    <InputGroup key={fieldName + "-inputGroup"}>
                        <Form.Control
                            key={fieldName + "formControl"}
                            as="select"
                            defaultValue = {fieldContents}
                            onChange={(e) => {
                                setField(e.currentTarget.value);
                                changeDependantFields(fieldName, e.currentTarget.value, fieldElements, fieldHandlers);
                            }}
                        >
                            <option hidden disabled value=''>{'Select...'}</option>
                            {fieldElements.values().map(function(sType, index) {
                                return <option key={fieldKey + "-" + sType + "-" + index} value={sType}>{fieldElements.display !== undefined ? fieldElements.display(sType) : sType}</option>;
                            })}
                        </Form.Control>
                    </InputGroup>
            </Form.Group>
        )
    }

    return (
        <Form.Group className="page1-formgroup" key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Row>
                <Form.Label key={fieldName + "-label"}>{friendlyFieldName}</Form.Label>
                <InputGroup key={fieldName + "-inputGroup"}>
                    <Form.Control
                        key={fieldName + "formControl"}
                        as="select"
                        defaultValue = {fieldContents}
                        onChange={(e) => {
                            setField(e.currentTarget.value);
                            changeDependantFields(fieldName, e.currentTarget.value, fieldElements, fieldHandlers);
                        }}
                    >
                        <option hidden disabled value=''>{'--Please Select an Option--'}</option>
                        {fieldElements.values().map(function(sType, index)  {
                            return <option key={fieldKey + "-" + sType + "-" + index} value={sType}>{fieldElements.display !== undefined ? fieldElements.display(sType) : sType}</option>;
                        })}
                    </Form.Control>
                </InputGroup>
            </Row>
        </Form.Group>
    );
}

const createCodeableConceptElement = (friendlyField: FriendlyResourceProps, codeableConceptEditorPropsOverrides: Partial<CodeableConceptEditorProps>, fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element => {
    const fieldKey: string = friendlyField.FHIR;
    const friendlyFieldName: string = friendlyField.FRIENDLY;
    const { fieldName, codeableConcept, setCodeableConcept, codeableConceptSaveHandler } = codeableConceptCardField(fieldKey, node);
    fieldHandlers.set(fieldName, {fieldName, fieldContents: codeableConcept, fieldAncestry: friendlyField.PARENTS ?? [], setField: setCodeableConcept, fieldSaveHandler: codeableConceptSaveHandler})
    return (
        <Form.Group className="page1-formgroup" key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Row>
                    <Form.Label key={fieldName + "-label"}>{friendlyFieldName}</Form.Label>
                    <div>
                        <CodeableConceptEditor {...codeableConceptEditorPropsOverrides} curCodeableConcept={codeableConcept} setCurCodeableConcept={setCodeableConcept} />
                    </div>
            </Row>
        </Form.Group>
    );
}

const createDisplayElement = ( displayProps: previewProps,friendlyFields: FriendlyResourceFormElement[], fieldHandler: FieldHandlerProps): JSX.Element => {
    return (
        <Form.Group key={fieldHandler.fieldName + "-fromGroup"} as={Col} controlId={fieldHandler.fieldName} {...(displayProps.displayFieldTitle) == true && {className: displayProps.className}}>
            <Form.Label key={fieldHandler.fieldName + "-label"} className = {displayProps.className}>
                <b>{(displayProps.displayFieldTitle) == true && (friendlyFields.find(ff => ff.SELF.FHIR === fieldHandler.fieldName)?.SELF.FRIENDLY ?? "FRIENDLY_NAME_UNKNOWN")}</b>
                {displayProps.friendlyDisplay !== undefined ? displayProps.friendlyDisplay(fieldHandler.fieldContents) : fieldHandler.fieldContents}
            </Form.Label>
        </Form.Group>
    )
}

const createDisplayElementList = (innerCardForm: ICardForm,fieldHandlers: Map<string, FieldHandlerProps>, resourceType: FriendlyResourceProps): JSX.Element[] => {
    const friendlyFields = getFormElementListForResource(resourceType.FHIR);
    const flattenFriendlyFields = allFormElems(friendlyFields);
    const defaultBoxProps: previewProps = {className: "", displayFieldTitle: true }
    const list: JSX.Element[] = [];

    fieldHandlers.forEach(fh => {
        if (innerCardForm.textBoxFields.get(fh.fieldName) !== undefined) {
            list.push(createDisplayElement(innerCardForm.textBoxFields.get(fh.fieldName)?.preview ?? defaultBoxProps,flattenFriendlyFields,fh));
        }
        else if (innerCardForm.dropdownFields.get(fh.fieldName) !== undefined) {
            list.push(createDisplayElement(innerCardForm.dropdownFields.get(fh.fieldName)?.preview ?? defaultBoxProps,flattenFriendlyFields,fh));
        }
        else if (innerCardForm.codeableConceptFields.get(fh.fieldName) !== undefined) {
            list.push(createDisplayElement(innerCardForm.codeableConceptFields.get(fh.fieldName)?.preview ?? defaultBoxProps,flattenFriendlyFields,fh));
        }
        else {
            list.push(createDisplayElement(defaultBoxProps,flattenFriendlyFields,fh));
        }
    })

    return list;
}

const createTextBoxElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const defaultBoxProps: textBoxProps = { boxSize: 1, isReadOnly: false, isLink: false, caption: ""}
    return friendlyFields
        .filter(ff => innerCardForm.textBoxFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createTextBoxElement(ff.SELF, innerCardForm.textBoxFields.get(ff.SELF.FHIR) ?? defaultBoxProps, fieldHandlers, node)
        });
}

const createDropdownElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    return friendlyFields
        .filter(ff => innerCardForm.dropdownFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createDropdownElement(ff.SELF, innerCardForm.dropdownFields.get(ff.SELF.FHIR) ?? {values: () => []}, fieldHandlers, node)
        })
}

const createCodeableConceptElementList = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    return friendlyFields
        .filter(ff => innerCardForm.codeableConceptFields.has(ff.SELF.FHIR))
        .map(ff => {
            return createCodeableConceptElement(ff.SELF, innerCardForm.codeableConceptFields.get(ff.SELF.FHIR) ?? {}, fieldHandlers, node)
        })
}

function handleInvisibleFieldList(innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode) {
    friendlyFields
        .filter(ff => innerCardForm.invisibleFields.has(ff.SELF.FHIR))
        .forEach(ff => {
            const [fieldName, fieldContents, setField, fieldSaveHandler, fieldAncestry] = simpleCardField(ff.SELF.FHIR, node, ff.SELF.PARENTS ?? []);
            fieldHandlers.set(fieldName, { fieldName, fieldContents, fieldAncestry, setField, fieldSaveHandler, otherFieldChangeTriggerFn: innerCardForm.invisibleFields.get(ff.SELF.FHIR)?.otherFieldTriggerFn });
        });
}

const fieldElementListForType = (innerCardForm: ICardForm, friendlyFields: FriendlyResourceFormElement[], fieldHandlers: Map<string, FieldHandlerProps>, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const flattenFriendlyFields = allFormElems(friendlyFields);
    handleInvisibleFieldList(innerCardForm, flattenFriendlyFields, fieldHandlers, node);
    return [
        ...createTextBoxElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
        ...createDropdownElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
        ...createCodeableConceptElementList(innerCardForm, flattenFriendlyFields, fieldHandlers, node),
    ]
}



function changeDependantFields(changedField: string, fieldValue: string, fieldProps: fieldFormProps, fieldHandlers: Map<string, FieldHandlerProps>) {
    fieldProps.requiredFor?.forEach(requiredField => {
        const reactFieldHandler = fieldHandlers.get(requiredField);
        if (reactFieldHandler) {
            const triggerFn = reactFieldHandler.otherFieldChangeTriggerFn;
            if (triggerFn) {
                reactFieldHandler.setField(triggerFn(changedField, fieldValue, fieldHandlers, requiredField));
            }
        }
    })


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

    const fieldHandlers: Map<string, FieldHandlerProps> = new Map;
    // const fieldHandlers: any[][] = [];

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
     * Callback to write changes from the editor into the freezer-js state and return to the collection view
     */
    async function handleSaveResource() {
        fieldHandlers.forEach((handler) => handler.fieldSaveHandler(handler.fieldName, handler.fieldContents, actNode, planNode, handler.fieldAncestry));
        props.handleSaveResource();
    }

    return (
        <div>
            <div key={actResourceType.FHIR + "-form"}  id="commonMetaDataForm">
                <OuterCardForm
                    sageNode={actNode}
                    fieldHandlers={fieldHandlers}
                    conditionEditor={props.conditionEditor}
                    resourceType={actResourceType}
                    elementList={fieldElementListForType(innerCardForm, getFormElementListForResource(innerCardForm.resourceType.FHIR), fieldHandlers, actNode)}
                    previewList={createDisplayElementList(innerCardForm,fieldHandlers, actResourceType)}
                    innerCardForm={innerCardForm}
                    handleSaveResource={handleSaveResource}
                    handleExit={props.handleExit}
                />
            </div>
        </div>
    );

}

function CardStateEditor<T>(node: SageNodeInitializedFreezerNode, resourceName: string, fieldAncestry: string[]): [any, Dispatch<SetStateAction<T>>] {
    const descendantNode = SchemaUtils.getChildOfNodePath(node, [...fieldAncestry, resourceName]);
    return useState<T>(descendantNode?.value || "");
}
