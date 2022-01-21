import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import * as SchemaUtils from "../helpers/schema-utils";
import { Color } from "react-bootstrap/esm/types";

interface BaseCardProps {
    header: string,
    title: string,
    profile?: string,
    wait?: number,
    content?: JSX.Element,
    clickable?: boolean
    link?: string
    bsBg?: string,
    bsText?: Color | string,
    bsBorder?: string,
}

export const BaseCard = (props: BaseCardProps) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShow(true);
        }, props.wait);
        return () => clearTimeout(timeoutId);
      }, [props.wait]);


    let index = props.header.indexOf("activity");
    let header = index >= 0 && props.header.length > "ActivityDefinition".length 
        ? props.header.slice(0, index) : props.header;
    if (header.length > 24) {
        header = header.slice(0,21) + "...";
    }
    index = props.title.indexOf("Activity");
    let title = index >= 0 ? props.title.slice(0, index) : props.title;
    if (title.startsWith("CPG")) title = title.slice(3);
    if (title.length > 22) {
        title = title.slice(0,19) + "...";
    }
    const content = props.content;
    let headerPadding = {};
    if (title == "") headerPadding = {padding:"7px"};
    const isActivity = index >= 0;
    
    return (
        <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-card"
        >
        <Card
            bg={props.bsBg}
            text={props.bsText as Color}
            border={props.bsBorder}
                onClick={(e: any) => {
                    if (e.target.tagName !== "svg" && e.target.tagName !== "path" && props.clickable) {
                        setShow(false);
                        if (State.get().bundle?.resources.length) {
                            State.emit("save_changes_to_bundle_json");
                            State.get().bundle.set("pos", State.get().bundle.resources.length-1);
                            State.get().ui.set("openMode", "insert");
                        }
                        const json = {
                            resourceType: "Bundle",
                            entry: [
                                {
                                    resource: {resourceType: isActivity ? "ActivityDefinition" : "Questionnaire"}},
                                {
                                    resource: {
                                        resourceType: "PlanDefinition",
                                        library: [],
                                        action: [
                                            {
                                                title: "",
                                                description: "",
                                                condition: [
                                                    {
                                                        kind: "applicability",
                                                    }
                                                ],
                                                definitionCanonical: `http://fhir.org/guides/${State.get().publisher}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount}`
                                            }
                                        ]
                                    }
                                }
                            ]
                            };
                        //const resourceProfile = SchemaUtils.getProfileOfResource(State.get().profiles, resourceJson);
                        if (isActivity) {
                            (json.entry[0].resource as any).meta = {
                                profile: [props.profile]
                            };
                        }
                        State.emit("load_json_resource", json);
                    }
                }}
                >
                <Card.Header style={headerPadding}>
                    {header}
                </Card.Header>
                <Card.Body>
                    <Card.Title>{title}</Card.Title>
                    <Card.Text>
                        {content}
                    </Card.Text>
                </Card.Body>
                </Card>
        </CSSTransition>
    );
}