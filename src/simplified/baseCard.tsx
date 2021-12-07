import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import React from "react";
import State from "../state";
import * as SchemaUtils from "../helpers/schema-utils";


export const BaseCard = (props:any) => {
    let [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, props.wait);
      }, []);


    let index = props.header.indexOf("Activity");
    let header = index >= 0 && props.header.length > "ActivityDefinition".length 
        ? props.header.slice(0, index) : props.header;
    if (header.length > 26) {
        header = header.slice(0,22) + "...";
    }
    index = props.title.indexOf("Activity");
    let title = index >= 0 ? props.title.slice(0, index) : props.title;
    if (title.length > 22) {
        title = title.slice(0,19) + "...";
    }
    const content = props.content;
    
    return (
        <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-card"
        >
        <Card
                onClick={(e: any) => {
                    if (e.target.tagName !== "svg" && e.target.tagName !== "path" && props.clickable) {
                    setShow(false);
                    setTimeout(() => {
                    State.get().set({
                        CPGName: "name",
                        Publisher: "auth",
                    })
                    let resourceJson = {resourceType: "ActivityDefinition"};
                    let json = {resourceType: "Bundle", entry: [{resource: resourceJson}]};
                    const resourceProfile = SchemaUtils.getProfileOfResource(State.get().profiles, resourceJson);
                    (json.entry[0].resource as any).meta = {
                        profile: [props.profile]
                    };
                    return State.emit("load_json_resource", json);
                    }, 300)
                    }
                }}
                >
                <Card.Header as="h6">
                    {header}
                </Card.Header>
                <Card.Body>
                    <Card.Title as="h6">{title}</Card.Title>
                    <Card.Text as="div">
                        {content}
                    </Card.Text>
                </Card.Body>
                </Card>
        </CSSTransition>
    );
}