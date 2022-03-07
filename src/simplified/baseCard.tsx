import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { Color } from "react-bootstrap/esm/types";
import { ACTIVITY_DEFINITION, friendlyToFhir, PLAN_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";
import { incrementNextId } from "../helpers/schema-utils";



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
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if (e.target instanceof Element && e.target.tagName !== "svg" && e.target.tagName !== "path" && props.clickable) {
                    setShow(false);
                    if (State.get().bundle?.resources.length) {
                        State.emit("save_changes_to_bundle_json");
                        State.get().bundle.set("pos", State.get().bundle.resources.length-1);
                        State.get().ui.set("openMode", "insert");
                    }
                    const nextId = incrementNextId(); // Saving some trouble by using this -- we should decide on a standard way to generate unique URLs
                    const referencedResourceName = `${resourceType}-${State.get().CPGName}${nextId}`;
                    const referencedResourceUrl = `http://fhir.org/guides/${State.get().publisher}/${resourceType}/${referencedResourceName}`;
                    const json = {
                        resourceType: "Bundle",
                        entry: [
                            {
                                resource: {
                                    resourceType: resourceType,
                                    name: referencedResourceName,
                                    url: referencedResourceUrl,
                                    meta: {profile: [props.profile]}
                                }
                            },
                            {
                                resource: {
                                    resourceType: PLAN_DEFINITION,
                                    library: "", // r4 expects library as an array, cpg expects a single value (we are always using the cpg spec in basic view)
                                    action: [
                                        {
                                            title: "",
                                            description: "",
                                            condition: [],
                                            definitionCanonical: referencedResourceUrl
                                        }
                                    ]
                                }
                            }
                        ]
                    };
                    State.emit("load_json_resource", json);
                    // Set current editor position to the last resource (should be the PlanDefinition in `json` after the "load_json_resource" call)
                    State.emit("set_bundle_pos", State.get().bundle.resources.length-1);
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