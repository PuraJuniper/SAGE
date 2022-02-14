import * as cql from "cql-execution";
import { Library, PlanDefinitionActionCondition } from "fhir/r4";
import { ExtractTypeOfFN } from "freezer-js";
import React, { ElementType, useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import hypertensionLibraryJson from "../../public/samples/hypertension-library.json";
import * as SageUtils from "../helpers/sage-utils";
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import { OuterCardForm, CardFormProps, textBoxProps } from "./cardForm";
import { textBoxFields, dropdownFields } from './medicationRequestForm';
import { ACTIVITY_DEFINITION, FriendlyResourceFormElement, FriendlyResourceListEntry, getFormElementListForResource, profileToFriendlyResourceListEntry } from "./nameHelpers";



const hypertensionLibrary: Library = hypertensionLibraryJson as Library;

interface ExpressionOptionDict {
    [expression: string]: ExpressionOption // The key is exactly what's written in the Condition's "expression" element
}
interface CardEditorProps {
    actNode: SageNodeInitializedFreezerNode,
    planNode: SageNodeInitializedFreezerNode,
}
interface ExpressionOption {
    expressionInLibrary: string,
    libraryIdentifier: string,
    libraryUrl: string,
}

const simpleCardField = (fieldName: string, actNode: SageNodeInitializedFreezerNode) => {
    const [fieldContents, setField] = CardStringStateEditor(actNode, fieldName);
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
    function returnVal() {
        if (textProps.isLink) {
            return <Button key={fieldName + "-button"} variant="link" onClick={() => window.open(fieldContents)}>{fieldContents}</Button>;
        } else {
            return <Form.Control key={fieldName + "-formControl"}
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
            <Form.Label key={fieldName + "-formLabel"}>{friendlyFieldName}</Form.Label>
            <Form.Text key={fieldName + "-formText"}>{textProps.caption}</Form.Text>
            <Col key={fieldName + "-col"} sm={10}>
                {returnVal()}
            </Col>
        </Form.Group>
    );
}

const createDropdownElement = (fieldKey: string, fieldFriendlyName: string, fieldElements: string[], fieldHandlers: any[][], node: SageNodeInitializedFreezerNode): JSX.Element => {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, node);
    fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
    return (
        <Form.Group key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
            <Form.Label key={fieldName + "-label"}>{fieldFriendlyName}</Form.Label>
            <Col key={fieldName + "-col"} sm={10}>
                <InputGroup key={fieldName + "-inputGroup"} className="mb-3">
                    <Form.Control
                        key={fieldName + "formControl"}
                        as="select"
                        defaultValue={fieldContents}
                        onChange={(e) => setField(e.currentTarget.value)}
                    >
                        {fieldElements.map(sType => {
                            return <option key={fieldKey + "-" + sType} value={sType}>{sType}</option>;
                        })}
                    </Form.Control>
                </InputGroup>
            </Col>
        </Form.Group>
    );
}

const createTextBoxElementList = (friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const defaultBoxProps: textBoxProps = { boxSize: 1, isReadOnly: false, isLink: false, caption: "" }
    return friendlyFields
        .filter(ff => textBoxFields.has(ff.FHIR))
        .map(ff => {
            return createTextBoxElement(ff.FHIR, ff.FRIENDLY,
                textBoxFields.get(ff.FHIR) ?? defaultBoxProps, fieldHandlers, node)
        });
}

const createDropdownElementList = (friendlyFields: FriendlyResourceFormElement[], fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    return friendlyFields
        .filter(ff => dropdownFields.has(ff.FHIR))
        .map(ff => {
            return createDropdownElement(ff.FHIR, ff.FRIENDLY, dropdownFields.get(ff.FHIR) ?? [], fieldHandlers, node)
        })
}

const fieldElementListForType = (resourceType: FriendlyResourceListEntry, fieldHandlers: any, node: SageNodeInitializedFreezerNode): JSX.Element[] => {
    const friendlyFields = getFormElementListForResource(resourceType.FHIR);
    return [
        ...createTextBoxElementList(friendlyFields, fieldHandlers, node),
        ...createDropdownElementList(friendlyFields, fieldHandlers, node)
    ]
}

const conditionCardField = (planNode: SageNodeInitializedFreezerNode) => {
    const [condition, setCondition] = CardPDActionConditionStateEditor(planNode);
    function conditionSaveHandler(name: string, contents: any, act: any, plan: any) {
        const conditionNode = SchemaUtils.getChildOfNodePath(plan, ["action", name]);
        if (conditionNode) {
            const conditionNodes = SchemaUtils.getChildrenFromObjectArrayNode(conditionNode);
            State.emit("load_json_into", conditionNodes[0], condition);
        }
    }
    return ["condition", condition, setCondition, conditionSaveHandler]
}

export const CardEditor = (props: CardEditorProps) => {
    const actNode = props.actNode;
    const planNode = props.planNode;
    function getResourceType(): FriendlyResourceListEntry {
        const resourceProfile = (): string => {
            if (actNode) {
                const fhirResource = SchemaUtils.toFhir(actNode, false);
                const meta = fhirResource ? fhirResource.meta : undefined;
                const profile = meta ? meta.profile : undefined;
                return profile ? profile[0] : "";
            } else {
                return "";
            }
        };
            return profileToFriendlyResourceListEntry(resourceProfile());
    }
    const actResourceType = getResourceType();
    const fieldHandlers: any[][] = [];

    return (
        <div>
            <Form key={actResourceType.FHIR + "-form"} style={{ color: "#2a6b92" }} id="commonMetaDataForm" target="void" onSubmit={handleSaveResource}>
                <OuterCardForm
                    sageNode={actNode}
                    fieldHandlers={fieldHandlers}
                    resourceType={actResourceType}
                    elementList={fieldElementListForType(actResourceType, fieldHandlers, actNode)}
                />
            </Form>

        </div>
    );

    function handleSaveResource() {
        fieldHandlers.forEach((field) => field[3](field[0], field[1], actNode, planNode));
        State.get().set("ui", { status: "collection" });
    }
}

function ConditionDropdown(fieldList: any[][]) {
    const conditionField = fieldList.find((field) => field[0] == "condition") ?? ["", "", () => { return undefined }];
    const libraryField = fieldList.find((field) => field[0] == "library") ?? ["", "", () => { return undefined }];
    const [expressionOptions, setExpressionOptions] = useState<ExpressionOptionDict>({});
    const [FhirLibrary, setFhirLibrary] = useState<any>();
    const [showLibraryImportModal, setShowLibraryImportModal] = useState<boolean>(false);

    // Initialization
    InitializeLibraries(setExpressionOptions);

    return (
        <>
            {libraryModalElement(showLibraryImportModal, setShowLibraryImportModal, setFhirLibrary, () => handleImportLibrary(FhirLibrary))}
            <Row className="mb-2">
                <Form.Group as={Col} controlId="condition">
                    <Form.Label>Condition</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control as="select"
                            onChange={(e) => {
                                if (e.currentTarget.value == '') {
                                    conditionField[2](buildConditionFromSelection());
                                    libraryField[2]("");
                                }
                                else if (e.currentTarget.value == '[[import library]]') {
                                    setShowLibraryImportModal(true);
                                    conditionField[2](buildConditionFromSelection());
                                    libraryField[2]("");
                                }
                                else {
                                    conditionField[2](buildConditionFromSelection(e.currentTarget.value));
                                    libraryField[2](expressionOptions[e.currentTarget.value].libraryUrl);
                                }
                            }}
                            value={conditionField[1].expression?.expression}
                        >
                            <option key="" value="">None</option>
                            {Object.keys(expressionOptions).map((v) => {
                                const exprOption = expressionOptions[v];
                                return <option key={v} value={v}>{`${exprOption.expressionInLibrary} (${exprOption.libraryIdentifier})`}</option>;
                            })}
                            <option key="[[import library]]" value="[[import library]]">Import condition from FHIR Library...</option>
                        </Form.Control>
                    </InputGroup>
                </Form.Group>
            </Row>
        </>
    )
}

const buildConditionFromSelection = (expression?: string): PlanDefinitionActionCondition => {
    let insertedExpression = "";
    if (expression) {
        insertedExpression = expression;
    }
    return {
        expression: {
            language: 'text/cql',
            expression: insertedExpression
        },
        kind: 'applicability'
    };
}

function CardPDActionConditionStateEditor(planNode: SageNodeInitializedFreezerNode): [any, any] {
    return useState<PlanDefinitionActionCondition>(() => {
        return buildConditionFromSelection(SchemaUtils.getChildOfNodePath(planNode, ["action", "condition", "expression", "expression"])?.value);
    });
}

function CardStringStateEditor(node: SageNodeInitializedFreezerNode, resourceName: string): [any, any] {
    return useState<string>(SchemaUtils.getChildOfNode(node, resourceName)?.value || "");
}

function handleImportLibrary(FhirLibrary: string) {
    if (FhirLibrary) {
        try {
            const parsedFhir = JSON.parse(FhirLibrary);
            const newLib = SageUtils.getCqlExecutionLibraryFromInputLibraryResource(parsedFhir);
            if (newLib) {
                State.emit("load_library", newLib.library, newLib.url, parsedFhir);
            }
        }
        catch (err) {
            console.log("Could not parse FHIR Library as JSON object");
            return;
        }
    }
}

function InitializeLibraries(setExpressionOptions: { (value: React.SetStateAction<ExpressionOptionDict>): void; (arg0: ExpressionOptionDict): void; }) {
    useEffect(
        () => {
            const initialLibraries = State.get().simplified.libraries;
            const librariesListener = initialLibraries.getListener();
            const updateCB = function (libraries: ExtractTypeOfFN<typeof initialLibraries>) {
                setLibraries(Object.keys(libraries).map((v) => {
                    return {
                        library: libraries[v].library,
                        url: libraries[v].url
                    };
                }));
            };
            librariesListener.on("update", updateCB);
            const newLib = SageUtils.getCqlExecutionLibraryFromInputLibraryResource(hypertensionLibrary);
            if (newLib) {
                State.emit("load_library", newLib.library, newLib.url, hypertensionLibrary);
            }
            return () => {
                librariesListener.off("update", updateCB);
            };
        },
        []
    );

    const getExpressionOptionsFromLibraries = (libraries: { library: cql.Library, url: string }[]) => {
        const foundOptions: ExpressionOptionDict = {};
        for (const library of libraries) {
            for (const expressionKey of Object.keys(library.library.expressions)) {
                const libId = library.library.source.library.identifier.id;
                foundOptions[`${libId}.${expressionKey}`] = {
                    expressionInLibrary: expressionKey,
                    libraryIdentifier: libId,
                    libraryUrl: library.url
                };
            }
        }
        return foundOptions;
    }

    const [libraries, setLibraries] = useState<{ library: cql.Library, url: string }[]>([]);
    useEffect(
        () => {
            setExpressionOptions(getExpressionOptionsFromLibraries(libraries));
            return;
        },
        [libraries, setExpressionOptions],
    );
}

function libraryModalElement(showLibraryImportModal: boolean, setShowLibraryImportModal: React.Dispatch<React.SetStateAction<boolean>>, setFhirLibrary: React.Dispatch<any>, handleImportLibrary: () => void) {
    return <>
        <Modal show={showLibraryImportModal} onHide={() => setShowLibraryImportModal(false)}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Import Library</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Paste in the FHIR Library Resource that contains the condition you wish to use below:
                <Form className="signup-form">
                    <Form.Group>
                        <Form.Control as="textarea" rows={14} wrap="hard"
                            className="name-input" type="text" placeholder="FHIR Library" name="FHIR Library"
                            autoComplete="off"
                            onChange={(e) => setFhirLibrary(e.currentTarget.value)} />
                    </Form.Group>
                </Form>
                <i>Please note that any dependencies of the pasted FHIR Library will not be automatically resolved or added to the final Bundle.</i>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowLibraryImportModal(false)}>
                    Close
                </Button>
                <Button variant="primary"
                    onClick={() => {
                        handleImportLibrary();
                        setShowLibraryImportModal(false);
                    }}
                >
                    Import
                </Button>
            </Modal.Footer>
        </Modal>
    </>;
}

