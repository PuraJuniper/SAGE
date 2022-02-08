import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as cql from "cql-execution";
import { Library, PlanDefinitionActionCondition } from "fhir/r4";
import { ExtractTypeOfFN } from "freezer-js";
import React, { ElementType, useEffect, useState } from "react";
import { Button, Col, Form, FormText, InputGroup, Modal, Row } from 'react-bootstrap';
import hypertensionLibraryJson from "../../public/samples/hypertension-library.json";
import * as SageUtils from "../helpers/sage-utils";
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import { ACTIVITY_DEFINITION, getFormElementListForResource, profileToFriendlyResourceListEntry } from "./nameHelpers";


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

function insertCardName(actResourceType: any) {
    return <h3 style={{ marginTop: "20px", marginBottom: "10px" }}><b>
        {actResourceType ? actResourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
    </b></h3>;
}

const insertSaveButton = <button className="navigate col-lg-2 col-md-3"
    type="submit">
    Save Card&nbsp;
    <FontAwesomeIcon icon={faCaretRight} />
</button>;

const insertDeleteCardButton = (state: any) => {
    return <button className="navigate-reverse col-lg-2 col-md-3"
        onClick={() => {
            State.emit("remove_from_bundle", state.bundle.pos + 1);
            State.emit("remove_from_bundle", state.bundle.pos);
            State.get().set("ui", { status: "cards" });
        }}
    >
        <FontAwesomeIcon icon={faCaretLeft} />
        &nbsp;Delete Card
    </button>;
}

const insertCardHeader = (state: any, actResourceType: any) => {
    return (
        <>
            {insertDeleteCardButton(state)}
            {insertSaveButton}
            {insertCardName(actResourceType)}
        </>
    );
}

<<<<<<< HEAD
function insertTextBoxField(fieldList: any[][], fieldKey: string, friendlyFieldName: string, actNode: SageNodeInitializedFreezerNode, boxSize: number = 1, isReadOnly: boolean = false, isLink: boolean = false, caption: string) {
=======
function insertTextBoxField(fieldList: any[][], fieldKey: string, friendlyFieldName: string, actNode: SageNodeInitializedFreezerNode, boxSize = 1, isReadOnly = false, isLink = false) {
>>>>>>> 53f22245862fe237246d7eff7489d746462d7da5
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, actNode);
    function returnVal() {
        if (isLink) {
            return <Button variant="link" onClick={() => window.open(fieldContents)}>{fieldContents}</Button>;
        } else {
            return <Form.Control
                {...{
                    ...(isReadOnly) && { readOnly: isReadOnly },
                    ...(boxSize) > 1 && { as: "textarea" as ElementType<any>, rows: boxSize },
                    ...{
                        type: "text",
                        defaultValue: fieldContents,
                        onChange: (e: { currentTarget: { value: any; }; }) => setField(e.currentTarget.value)
                    }
                }} />;
        }
    }

    fieldList.push([fieldName, fieldContents, setField, fieldSaveHandler]);

    return (
        <Form.Group key={fieldName} as={Col} controlId={fieldName}>
            <Form.Label>{friendlyFieldName}</Form.Label>
            <Form.Text>{caption}</Form.Text>
            <Col key={fieldName} sm={10}>
                {returnVal()}
            </Col>
        </Form.Group>
    );
}

function insertDropdownElement(fieldKey: string, fieldFriendlyName: string, fieldElements: string[], actNode: SageNodeInitializedFreezerNode, fieldList: any[][]) {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, actNode);
    fieldList.push([fieldName, fieldContents, setField, fieldSaveHandler]);
    return (
        <Form.Group key={fieldName} as={Col} controlId={fieldKey}>
            <Form.Label>{fieldFriendlyName}</Form.Label>
            <Col key={fieldName} sm={10}>
                <InputGroup className="mb-3">
                    <Form.Control
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

const generateElementsForType = (fieldList: any[][], type: string, actNode: SageNodeInitializedFreezerNode) => {
    const friendlyFields = getFormElementListForResource(type);
    switch (type) {
        case "MedicationRequest":
            return ([
                insertDropdownElement(
                    "status",
                    friendlyFields!.find(elem => elem.FHIR == 'status')!.FRIENDLY,
                    ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'],
                    actNode,
                    fieldList
                ),
                insertDropdownElement(
                    "intent",
                    friendlyFields!.find(elem => elem.FHIR == 'intent')!.FRIENDLY,
                    ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
                    actNode,
                    fieldList
                ),
                insertTextBoxField(
                    fieldList,
                    "relatedArtifact",
                    friendlyFields!.find(elem => elem.FHIR == 'relatedArtifact')!.FRIENDLY,
                    actNode,
                    1,
                    true,
                    false,
                    ""
                ),
                insertDropdownElement(
                    "productReference",
                    friendlyFields!.find(elem => elem.FHIR == 'productReference')!.FRIENDLY,
                    ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
                    actNode,
                    fieldList
                ),
                insertTextBoxField(
                    fieldList,
                    "text",
                    friendlyFields!.find(elem => elem.FHIR == 'text')!.FRIENDLY,
                    actNode,
                    4,
                    false,
                    false,
                    "NOTE: For advanced timing instructions, leave basic dosage sentence blank."
                )
            ]);
        default:
            return [];
    }
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
    const actResourceType = profileToFriendlyResourceListEntry(SchemaUtils.toFhir(actNode, false).meta?.profile?.[0]) ?? {FHIR: ""};
    const state = State.get();
    const titleKey = "title";
    const descriptionKey = "description";
    const fieldNameMap = new Map([
        [titleKey, "Card short name:"],
        [descriptionKey, "Card description:"]
    ]);
    const fieldList: any[][] = [
        // simpleCardField("library", actNode),
        // conditionCardField(planNode)
    ]

<<<<<<< HEAD
    const defaultFields = [insertTextBoxField(fieldList, titleKey, fieldNameMap.get(titleKey)!, actNode, 1, false, false, ""),
    insertTextBoxField(fieldList, descriptionKey, fieldNameMap.get(descriptionKey)!, actNode, 3, false, false, "")];
=======
    const defaultFields = [insertTextBoxField(fieldList, titleKey, fieldNameMap.get(titleKey) ?? "", actNode),
    insertTextBoxField(fieldList, descriptionKey, fieldNameMap.get(descriptionKey) ?? "", actNode, 3)];
>>>>>>> 53f22245862fe237246d7eff7489d746462d7da5
    const allCardFields = [...defaultFields,
    ...generateElementsForType(fieldList, actResourceType.FHIR, actNode)]
    const numRows = 3;

    // const returnVal = [...Array(numRows)].map((e, i) => {
    //     const numFields = allCardFields.length;
    //     if (i > numFields-1) {
    //         return <></>
    //     } else {
    //         const nextField = allCardFields[i + numFields-1];
    //         if (nextField) {
    //             return (
    //                 <Row key={"cardRow" + i} className="mb-3">
    //                     {allCardFields[i]}
    //                     {nextField}
    //                 </Row>
    //             );
    //         } else {
    //             return (
    //                 <Row key={"cardRow" + i} className="mb-3">
    //                     {allCardFields[i]}
    //                 </Row>
    //             );
    //         }
    //     }
    // }
    // )

    return (
        <div>
            <Form style={{ color: "#2a6b92" }} id="commonMetaDataForm" target="void" onSubmit={handleSaveResource}>
                {insertCardHeader(state, actResourceType)}
                {allCardFields}
            </Form>
        </div>
    );

    function handleSaveResource() {
        fieldList.forEach((field) => field[3](field[0], field[1], actNode, planNode));

        State.get().set("ui", { status: "collection" });
    }
}

function ConditionDropdown(fieldList: any[][]) {
    const conditionField = fieldList.find((field) => field[0] == "condition") ?? ["","", () => {return undefined}];
    const libraryField = fieldList.find((field) => field[0] == "library") ?? ["","", () => {return undefined}];
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

