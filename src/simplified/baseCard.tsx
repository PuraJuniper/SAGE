import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { friendlyToFhir } from "./nameHelpers";



interface BaseCardProps {
    header: string,
    title: string,
    profile?: string,
    wait?: number,
    content?: JSX.Element,
    clickable?: boolean
    link?: string
}

export const BaseCard = (props: BaseCardProps) => {
    const [show, setShow] = useState(false);
    
    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, props.wait);
    }, [props.wait]);
    
    
    
    const content = props.content;
    let headerPadding = {};
    if (props.title == "") headerPadding = {padding:"7px"};
    const resourceType = friendlyToFhir(props.header);
    const isActivity = resourceType?.includes("Acivity");
    
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
                    if (State.get().bundle?.resources.length) {
                        State.emit("save_changes_to_bundle_json");
                        State.get().bundle.set("pos", State.get().bundle.resources.length-1);
                        State.get().ui.set("openMode", "insert");
                    }
                    const json = {
                        resourceType: "Bundle",
                        entry: [
                            {
                                resource: {resourceType: friendlyToFhir(props.header)}
                            },
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
                    if (isActivity) {
                        (json.entry[0].resource as any).meta = {
                            profile: [props.profile]
                        };
                    }
                    State.emit("load_json_resource", json);
                }, 350)
            }
        }}
        >
        <Card.Header as="h6" style={headerPadding}>
        {props.header}
        </Card.Header>
        <Card.Body>
        <Card.Title as="h6">{props.title}</Card.Title>
        <Card.Text as="div">
        {content}
        </Card.Text>
        </Card.Body>
        </Card>
        </CSSTransition>
        );
    }