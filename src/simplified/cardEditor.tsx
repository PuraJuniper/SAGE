import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as cql from "cql-execution";
import { Library, PlanDefinitionActionCondition } from "fhir/r4";
import { ExtractTypeOfFN } from "freezer-js";
import React, { ElementType, useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import hypertensionLibraryJson from "../../public/samples/hypertension-library.json";
import * as SageUtils from "../helpers/sage-utils";
import * as SchemaUtils from "../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../state";
import { ACTIVITY_DEFINITION, profileToFriendlyResourceListEntry } from "./nameHelpers";


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

function insertTextBoxField(fieldList: any[][], fieldKey: string, friendlyFieldName: string, actNode: SageNodeInitializedFreezerNode, boxSize: number = 1, isReadOnly: boolean = false) {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, actNode);

    fieldList.push([fieldName, fieldContents, setField, fieldSaveHandler]);

    return (
        <Form.Group as={Row} controlId={fieldName}>
            <Form.Label column sm={2}>{friendlyFieldName}</Form.Label>
            <Col sm={10}>
                <Form.Control
                    {
                    ...{
                        ...(isReadOnly!) && { readOnly: isReadOnly },
                        ...(boxSize!) > 1 && { as: "textarea" as ElementType<any>, rows: boxSize },
                        ... {
                            type: "text",
                            defaultValue: fieldContents,
                            onChange: (e: { currentTarget: { value: any; }; }) => setField(e.currentTarget.value)
                        }
                    }
                    }
                />
            </Col>
        </Form.Group>
    );
}

function insertDropdownElement(fieldKey: string, fieldFriendlyName: string, fieldElements: string[], actNode: SageNodeInitializedFreezerNode, fieldList: any[][]) {
    const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, actNode);
    fieldList.push([fieldName, fieldContents, setField, fieldSaveHandler]);
    return (
        <Form.Group as={Row} controlId={fieldKey}>
            <Form.Label column sm={2}>{fieldFriendlyName}</Form.Label>
            <Col sm={10}>
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

const insertElementsForType = (fieldList: any[][], type: string, actNode: SageNodeInitializedFreezerNode) => {
    switch (type) {
        case "MedicationRequest":
            return (
                <>
                    {insertDropdownElement(
                        "status",
                        "Status:",
                        ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'],
                        actNode,
                        fieldList
                    )}
                    {insertDropdownElement(
                        "intent",
                        "Intent:",
                        ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
                        actNode,
                        fieldList
                    )}
                    {insertTextBoxField(
                        fieldList,
                        "profile",
                        "Related artefact",
                        actNode,
                        1,
                        true)
                    }
                </>
            )
        default:
            return;
    }
}

const simpleCardField = (fieldName: string, actNode: SageNodeInitializedFreezerNode) => {
    const [fieldContents, setField] = cardStringStateEditor(actNode, fieldName);
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
    const [condition, setCondition] = cardPDActionConditionStateEditor(planNode);
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
    const actResourceType = profileToFriendlyResourceListEntry(SchemaUtils.toFhir(actNode, false).meta?.profile?.[0]);
    const state = State.get();
    const titleKey = "title";
    const descriptionKey = "description";
    const fieldNameMap = new Map([
        [titleKey, "Card short name:"],
        [descriptionKey, "Card description:"]
    ]);
    const fieldList = [
        simpleCardField("library", actNode),
        conditionCardField(planNode)
    ]

    return (
        <div>
            <Form style={{ color: "#2a6b92" }} id="commonMetaDataForm" target="void" onSubmit={handleSaveResource}>
                {insertCardHeader(state, actResourceType)}
                {insertTextBoxField(fieldList, titleKey, fieldNameMap.get(titleKey)!, actNode)}
                {insertTextBoxField(fieldList, descriptionKey, fieldNameMap.get(descriptionKey)!, actNode, 3)}
                {/* {insertConditionDropdown(fieldList)} */}
                {insertElementsForType(fieldList, actResourceType!.FHIR, actNode)}
            </Form>
        </div>
    );

    function handleSaveResource() {
        fieldList.forEach((field) => field[3](field[0], field[1], actNode, planNode));

        State.get().set("ui", { status: "collection" });
    }
}

function insertConditionDropdown(fieldList: any[][]) {
    const conditionField = fieldList.find((field) => field[0] == "condition")!;
    const libraryField = fieldList.find((field) => field[0] == "library")!;
    const [expressionOptions, setExpressionOptions] = useState<ExpressionOptionDict>({});
    const [FhirLibrary, setFhirLibrary] = useState<any>();
    const [showLibraryImportModal, setShowLibraryImportModal] = useState<boolean>(false);

    // Initialization
    initializeLibraries(setExpressionOptions);

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

function cardPDActionConditionStateEditor(planNode: SageNodeInitializedFreezerNode): [any, any] {
    return useState<PlanDefinitionActionCondition>(() => {
        return buildConditionFromSelection(SchemaUtils.getChildOfNodePath(planNode, ["action", "condition", "expression", "expression"])?.value);
    });
}

function cardStringStateEditor(node: SageNodeInitializedFreezerNode, resourceName: string): [any, any] {
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

function initializeLibraries(setExpressionOptions: { (value: React.SetStateAction<ExpressionOptionDict>): void; (arg0: ExpressionOptionDict): void; }) {
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
        [libraries],
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

