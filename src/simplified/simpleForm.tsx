import React, { FormEvent, useEffect, useState } from "react";
import { Form, Row , Col} from 'react-bootstrap';
import State from "../state";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import * as SchemaUtils from "../helpers/schema-utils"


export const SimpleForm = (props:any) => {
    const state = State.get();

    const handleSubmit = function() {
        let elements = (document.getElementById("commonMetaDataForm") as HTMLFormElement).elements;
        let actionNode = SchemaUtils.getChildOfNode(props.planNode, "action");
        let subActionNode = actionNode ? SchemaUtils.getChildOfNode(actionNode, "action") : null;
        for(let i = 2 ; i < elements.length ; i++){
            // the first two indices (0,1) are the buttons, they count as form elements
            let item = (elements.item(i) as HTMLInputElement);
            let value = item.value;
            State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, item.id), value, false);
            State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, item.id), value, false);
            if (subActionNode && [""].includes(item.id)) {
                State.emit("value_change", SchemaUtils.getChildOfNode(subActionNode, item.id), value, false);
            }
        }
        State.emit("save_changes_to_bundle_json");
        State.get().set("ui", {status:"collection"})
    }
     
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
        <h3  style={{marginTop:"20px", marginBottom:"10px"}}><b>PlanDefinition/ActivityDefinition</b></h3>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="title">
                    <Form.Label as="b">Title</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "title") as any).value}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="description">
                    <Form.Label as="b">Description</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "description") as any).value}
                    />
                </Form.Group>
            </Row>
        </Form>
        </div>
    )
}