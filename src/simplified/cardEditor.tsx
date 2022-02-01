import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as cql from "cql-execution";
import { Library, PlanDefinitionActionCondition } from "fhir/r4";
import { ExtractTypeOfFN } from "freezer-js";
import React, { useEffect, useState } from "react";
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
    const fieldList = [
        simpleCardField("title", actNode),
        simpleCardField("description", actNode),
        simpleCardField("library", actNode),
        conditionCardField(planNode)
    ]

    return (
        <div>
            <Form style={{ color: "#2a6b92" }} id="commonMetaDataForm" target="void" onSubmit={handleSaveResource}>
                {insertCardHeader(state, actResourceType)}
                {insertTextBoxField(fieldList, "Title")}
                {insertTextBoxField(fieldList, "Description")}
                {insertConditionDropdown(fieldList)}
            </Form>
        </div>
    );

    // All logic for saving the Simplified Form data into the underlying FHIR Resources should be performed here
    function handleSaveResource() {
        fieldList.forEach((field) => field[3](field[0], field[1], actNode, planNode));

        if (actNode.displayName == ACTIVITY_DEFINITION) {
            emitChildNodeChange(actNode, State.get().experimental, "experimental");
            emitChildNodeChange(actNode, State.get().status, "status");
        }
        emitChildNodeChange(planNode, State.get().experimental, "experimental");
        emitChildNodeChange(planNode, State.get().status, "status");

        State.get().set("ui", { status: "collection" });

        function emitChildNodeChange(node: SageNodeInitializedFreezerNode, field: any, fieldName: string) {
            State.emit("value_change", SchemaUtils.getChildOfNode(node, fieldName), field, false);
        }
    }
}

function insertConditionDropdown(fieldList: any[][]) {
    
    const conditionField = fieldList.find((field) => field[0] ==  "condition")!;
    const libraryField = fieldList.find((field) => field[0] ==  "library")!;
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

    const [libraries, setLibraries] = useState<{ library: cql.Library, url: string }[]>([]);
    useEffect(
        () => {
            setExpressionOptions(getExpressionOptionsFromLibraries(libraries));
            return;
        },
        [libraries],
    );
}

function insertTextBoxField(fieldList: any[][], friendlyFieldName: string) {
    const [fieldName, fieldContents, setField] = fieldList.find(field => field[0] == friendlyFieldName.toLowerCase())!
    return <Row className="mb-2">
        <Form.Group as={Col} controlId={fieldName}>
            <Form.Label>{friendlyFieldName}</Form.Label>
            <Form.Control
                type="text"
                defaultValue={fieldContents}
                onChange={(e) => setField(e.currentTarget.value)} />
        </Form.Group>
    </Row>;
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

