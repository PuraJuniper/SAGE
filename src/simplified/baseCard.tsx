import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { Color } from "react-bootstrap/esm/types";
import { ACTIVITY_DEFINITION, friendlyToFhir, PLAN_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";



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
        return clearTimeout(timeoutId);
    }, [props.wait]);
    
    
    
    const content = props.content;
    let headerPadding = {};
    if (props.title == "") headerPadding = {padding:"7px"};
    const resourceType = friendlyToFhir(props.header);
    const isActivity = resourceType?.includes("Activity");
    
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
                                resource: {
                                    resourceType: isActivity ? ACTIVITY_DEFINITION : QUESTIONNAIRE,
                                    meta: {profile: [props.profile]}
                                }
                            },
                            {
                                resource: {
                                    resourceType: PLAN_DEFINITION,
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
                                            definitionCanonical: `http://fhir.org/guides/${State.get().publisher}/${ACTIVITY_DEFINITION}/${ACTIVITY_DEFINITION}-${State.get().CPGName}${State.get().resCount}`
                                        }
                                    ]
                                }
                            }
                        ]
                    };
                    State.emit("load_json_resource", json);
                }
            }}
        >
            <Card.Header style={headerPadding}>
                {props.header}
            </Card.Header>
            <Card.Body>
                <Card.Title>{props.title}</Card.Title>
                <Card.Text>
                    {content}
                </Card.Text>
            </Card.Body>
        </Card>
        </CSSTransition>
        );
    }