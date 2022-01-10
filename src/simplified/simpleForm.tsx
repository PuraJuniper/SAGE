import React, { FormEvent, useEffect, useState } from "react";
import { Form, Row , Col, InputGroup, DropdownButton, Dropdown, FormControl, Modal, Button} from 'react-bootstrap';
import State from "../state";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import * as SchemaUtils from "../helpers/schema-utils"
import { Expression, PlanDefinitionActionCondition } from "fhir/r4";
import * as SageUtils from "../helpers/sage-utils";

import hypertensionLibrary from "../../public/samples/hypertension-library.json";
import { Library } from "cql-execution";

interface ExpressionOptionDict {
    [expression: string]: ExpressionOption // The key is exactly what's written in the Condition's "expression" element
}
interface ExpressionOption {
    expressionInLibrary: string,
    libraryIdentifier: string,
    libraryUrl: string,
}

interface SimpleFormProps {
    actNode: SchemaUtils.SageNodeInitialized,
    planNode: SchemaUtils.SageNodeInitialized,
}

const buildConditionFromSelection = (expression?: string): PlanDefinitionActionCondition | undefined => {
    if (expression) {
        return {
            expression: {
                language: 'text/cql',
                expression: expression
            },
            kind: 'applicability'
        };
    }
    else {
        return undefined;
    }
}

const getExpressionOptionsFromLibraries = (libraries: {library: Library, url: string}[]) => {
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

export const SimpleForm = (props:SimpleFormProps) => {
    const state = State.get();
    // console.log(State.get().bundle?.resources?.[0]);
    const [title, setTitle] = useState<string>(SchemaUtils.getChildOfNode(props.actNode, "title")?.value || "");
    const [description, setDescription] = useState<string>(SchemaUtils.getChildOfNode(props.actNode, "description")?.value || "");
    const [condition, setCondition] = useState<PlanDefinitionActionCondition | undefined>(() => {
        return buildConditionFromSelection(SchemaUtils.getChildOfNodePath(props.planNode, ["action", "condition", "expression", "expression"])?.value)
    });
    const [selectedLibrary, setSelectedLibrary] = useState<string>(SchemaUtils.getChildOfNode(props.planNode, "library")?.value[0] || "")
    const [expressionOptions, setExpressionOptions] = useState<ExpressionOptionDict>({});
        
    // Initialization
    useEffect(
        () => {
            const initialLibraries = State.get().simplified.libraries;
            const librariesListener = initialLibraries.getListener();
            const updateCB = function(libraries: any, prevLibraries: any) {
                setLibraries(Object.keys(libraries).map((v) => {
                    return {
                        library: libraries[v].library,
                        url: libraries[v].url
                    }
                }));
            }
            librariesListener.on("update", updateCB);
            const newLib = SageUtils.getCqlExecutionLibraryFromInputLibraryResource(hypertensionLibrary);
            if (newLib) {
                State.emit("load_library", newLib.library, newLib.url, hypertensionLibrary);
            }
            return () => {
                librariesListener.off("update", updateCB);
            }
        },
        []
    )
    
    const [libraries, setLibraries] = useState<{library: Library, url: string}[]>([]);
    useEffect(
        () => {
            setExpressionOptions(getExpressionOptionsFromLibraries(libraries));
            return;
        },
        [libraries],
    );

    // Import Library Modal
    //  Allows the user to import a new CQL Library to use as a condition
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const handleShowImportModal = () => setShowImportModal(true);
    const handleCloseImportModal = () => setShowImportModal(false);
    const [FhirLibrary, setFhirLibrary] = useState<any>();
    const handleImportLibrary = () => {
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
    };
    const importModalElement = (<>
        <Modal show={showImportModal} onHide={handleCloseImportModal}
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
                            onChange={(e) => setFhirLibrary(e.currentTarget.value)}
                        />
                    </Form.Group>
                </Form>
                <i>Please note that any dependencies of the pasted FHIR Library will not be automatically resolved or added to the final Bundle.</i>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseImportModal}>
                Close
            </Button>
            <Button variant="primary" 
                onClick={() => {
                    handleImportLibrary();
                    handleCloseImportModal();
                }}
            >
                Import
            </Button>
            </Modal.Footer>
        </Modal>
    </>);

    // All logic for saving the Simplified Form data into the underlying FHIR Resources should be performed here
    const handleSaveResource = function() {
        // console.log(props.actNode);
        // console.log(title);
        // console.log(description);
        if (props.actNode.displayName == "ActivityDefinition") { // Questionnaires have trouble saving otherwise
            State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "title"), title, false);
            State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "description"), description, false);
            State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "experimental"), State.get().experimental, false);
            State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "status"), State.get().status, false);
        }
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "title"), title, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "description"), description, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "experimental"), State.get().experimental, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "status"), State.get().status, false);
        const titleNode = SchemaUtils.getChildOfNodePath(props.planNode, ["action", "title"]);
        if (titleNode) {
            State.emit("value_change", titleNode, title, false);
        }
        const descriptionNode = SchemaUtils.getChildOfNodePath(props.planNode, ["action", "description"]);
        if (descriptionNode) {
            State.emit("value_change", descriptionNode, description, false);
        }
        const conditionNode = SchemaUtils.getChildOfNodePath(props.planNode, ["action", "condition"]);
        if (conditionNode) {
            const conditionNodes = SchemaUtils.getChildrenFromObjectArrayNode(conditionNode);
            State.emit("load_json_into", conditionNodes[0], condition);
            State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "library"), [selectedLibrary], false);
        }
        State.get().set("ui", {status:"collection"})
    }

    return (
    <div>
        <iframe name="void" style={{display:"none"}}></iframe>
        {importModalElement}
        <Form style={{color:"#2a6b92"}} id="commonMetaDataForm" target="void" onSubmit={handleSaveResource}>
            <button className="navigate-reverse col-lg-2 col-md-3" 
                    disabled={state.bundle.resources.length <= 2}
                    onClick={() => {
                        State.emit("remove_from_bundle", state.bundle.pos + 1);
                        State.emit("remove_from_bundle", state.bundle.pos); 
                        State.get().set("ui", {status:"cards"})
                    }}>
                    <FontAwesomeIcon icon={faCaretLeft} />
                    &nbsp;Delete Resource
            </button>
            <button className="navigate col-lg-2 col-md-3" 
                    type="submit">
                    Save Resource&nbsp;
                    <FontAwesomeIcon icon={faCaretRight} />
            </button>
        <h3  style={{marginTop:"20px", marginBottom:"10px"}}><b>
            {props.actNode.displayName}
            /Plandefinition
        </b></h3>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="title">
                    <Form.Label>Title</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="condition">
                    <Form.Label>Condition</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control as="select" 
                            onChange={(e) => {
                                if (e.currentTarget.value == '') {
                                    setCondition(buildConditionFromSelection());
                                    setSelectedLibrary("");
                                }
                                else if (e.currentTarget.value == '[[import library]]') {
                                    handleShowImportModal();
                                    setCondition(buildConditionFromSelection());
                                    setSelectedLibrary("");
                                }
                                else {
                                    setCondition(buildConditionFromSelection(e.currentTarget.value));
                                    setSelectedLibrary(expressionOptions[e.currentTarget.value].libraryUrl);
                                }
                            }}
                            value={condition?.expression?.expression || ""}
                        >
                            <option key="" value="">None</option>
                            {Object.keys(expressionOptions).map((v) => {
                                const exprOption = expressionOptions[v];
                                return <option key={v} value={v}>{`${exprOption.expressionInLibrary} (${exprOption.libraryIdentifier})`}</option>
                            })}
                            <option key="[[import library]]" value="[[import library]]">Import condition from FHIR Library...</option>
                        </Form.Control>
                    </InputGroup>
                </Form.Group>
            </Row>
        </Form>
    </div>);
    
}