import React, { FormEvent, useEffect, useState } from "react";
import { Form, Row , Col} from 'react-bootstrap';
import State from "../state";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import * as SchemaUtils from "../helpers/schema-utils"
import { getExpressionsFromLibraries } from "./conditionBuilder";
import { Expression, PlanDefinitionActionCondition } from "fhir/r4";

interface SimpleFormProps {
    actNode: SchemaUtils.SageNodeInitialized,
    planNode: SchemaUtils.SageNodeInitialized,
}


export const SimpleForm = (props:SimpleFormProps) => {
    const state = State.get();
    // console.log(State.get().bundle?.resources?.[0]);
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [condition, setCondition] = useState<PlanDefinitionActionCondition>();
    let [availableExpressions, setAvailableExpressions] = useState<Expression[]>([]);

    const handleSubmit = function() {
        console.log(props.planNode);
        console.log(title);
        console.log(description);
        // State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "name"), title, false);
        // State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "name"), title, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "title"), title, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "title"), title, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "description"), description, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "description"), description, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "experimental"), State.get().experimental, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "experimental"), State.get().experimental, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "status"), State.get().status, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "status"), State.get().status, false);
        const actionNode = SchemaUtils.getChildOfNode(props.planNode, "action")
        if (actionNode) {
            console.log(actionNode);
            const actionNodes = SchemaUtils.getChildrenFromObjectArrayNode(actionNode);
            console.log(actionNodes);
            if (actionNodes) {
                State.emit("value_change", SchemaUtils.getChildOfNode(actionNodes[0], "title"), title, false);
                State.emit("value_change", SchemaUtils.getChildOfNode(actionNodes[0], "description"), description, false);
                if (condition) {
                    const conditionNode = SchemaUtils.getChildOfNode(actionNodes[0], "condition");
                    if (conditionNode) {
                        const conditionNodes = SchemaUtils.getChildrenFromObjectArrayNode(conditionNode);
                        State.emit("load_json_into", conditionNodes[0], condition);
                    }
                }
            }
        }
        State.get().set("ui", {status:"collection"})
    }

    useEffect(
        () => {
            setAvailableExpressions((a) => [...a, ...getExpressionsFromLibraries()])
            return () => {}
        },
        [],
    );

    // const getExpressionsFromLibraries = () => {
	// 	const parsedLib = new cql.Library(test);
    //     const foundExpressions: Expression[] = [];
	// 	for (const expressionKey of Object.keys(parsedLib.expressions)) {
    //         foundExpressions.push({
    //             language: 'text/cql',
    //             expression: expressionKey
    //         });
	// 	}
    //     setAvailableExpressions([...availableExpressions, ...foundExpressions]);
    // }
    console.log(props.actNode);
    return (
        <div>
        <iframe name="void" style={{display:"none"}}></iframe>
        <Form style={{color:"#2a6b92"}} id="commonMetaDataForm" target="void" onSubmit={handleSubmit}>
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
                    <Form.Label as="b">Title</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "title"))?.value}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="description">
                    <Form.Label as="b">Description</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "description"))?.value}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="condition">
                    <Form.Label as="b">Condition</Form.Label>
                    <Form.Control as="select" aria-label="Default select example" 
                    onChange={(e) => {
                        console.log(e.currentTarget.value);
                        setCondition({
                            expression: {
                                language: 'text/cql',
                                expression: e.currentTarget.value
                            },
                            kind: 'applicability'
                        })
                    }}>
                        <option key="" value="">None</option>
                        {availableExpressions.map((v) => {
                            return <option key={v.expression} value={v.expression}>{v.expression}</option>
                        })}
                    </Form.Control>
                </Form.Group>
            </Row>
        </Form>
        </div>
    )
}