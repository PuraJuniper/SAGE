import {Card, Row} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State, { SageUiStatus } from "../state";
import { Color } from "react-bootstrap/esm/types";
import { ACTIVITY_DEFINITION, friendlyToFhir, PLAN_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";
import { incrementNextId } from "../helpers/schema-utils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle,faGrid,faBookMedical,faCirclePlus, IconDefinition } from '@fortawesome/pro-solid-svg-icons';



interface HomeCardProps {
    header?: string,
    title: string,
    cardText?:string,
    content?: JSX.Element,
    cardImage:any,
    cardColor?:string,
    bsBg?: string,
    bsText?: Color | string,
    bsBorder?: string,
    FHIR: string,
    profile?: string,
    wait?: number,
    clickable?: boolean,
    link?: string,
}

export const HomeCard = (props: HomeCardProps) => {
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
    const resourceType = props.FHIR;


    console.log(props.profile)
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

                if (e.target instanceof Element && e.target.tagName !== "svg" && e.target.tagName !== "path" && props.clickable && resourceType!='') {
                    setShow(false);
                    if (State.get().bundle?.resources.length) {
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
                    return
                }
                if(props.title == 'Create Cards'){
                    State.get().set("ui", {status:"cards"})
                }
                if(props.title == 'View Cards'){
                    State.get().set("ui", {status:"collection"})
                }

            }}
        >

            <Card.Body>
                <Row style={{'justifyContent': 'flex-end', 'margin':'0'}}>
                    <span style={{ fontSize: "20px", textAlign: "right" }}>
                        <a href='' target="_blank" rel="noreferrer" className="c-tooltip">
                            <FontAwesomeIcon icon={faInfoCircle} style={{'color':'white'}} />
                            <span className="c-tooltiptext">FHIR Docs</span>
                        </a>
                    </span>
                </Row>
                <Card.Title style={{ fontSize: "20px", textAlign: "center" }}>{props.title}</Card.Title>
                <Row style={{'justifyContent': 'center', 'marginBottom':'30px'}}>
                    <FontAwesomeIcon icon={props.cardImage} style={{'color':'white', 'height':'60px'}} />
                </Row>
            </Card.Body>
        </Card>
        </CSSTransition>
        );
    }