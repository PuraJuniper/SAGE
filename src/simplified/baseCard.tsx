import React from 'react';
import {Button, Card, Col, Container, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { Color } from "react-bootstrap/esm/types";
import { ACTIVITY_DEFINITION, friendlyToFhir, PLAN_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";
import { generateResourceReference, incrementNextId } from "../helpers/schema-utils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle,faGrid,faBookMedical,faCirclePlus, IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import { AuthoringState } from './authoringInfo';
import { CreateCardWorkflow } from './selectView';
import { SAVED_CARDS_ROUTE } from './basicView';

interface BaseCardProps {
    header: string,
    title: string,
    profile?: string,
    wait?: number,
    content?: JSX.Element,
    onClick?: () => void,
    infoLink?: string,
    link?: string
    bsBg?: string,
    bsText?: Color | string,
    bsBorder?: string,
    hideHeader:boolean,
    cardImage?:any,
    IconColor?:string,
    IconSize?:string,
    titleSize?:string,
    disabled?: boolean,
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

    return (
        <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-card"
        >
        <Card
            className={`sage-card raise-card-animation ${props.disabled ? "disabled-card" : ""}`}
            bg={props.bsBg}
            text={props.bsText as Color}
            border={props.bsBorder}
            onClick={props.onClick}
            style={{margin: "5px", height: "auto"}}
        >
            <Card.Header style={headerPadding} hidden = {props.hideHeader}>
                {props.header}
            </Card.Header>
            <Card.Body style={{maxHeight: "inherit", maxWidth: "inherit", backgroundColor: "transparent", border: "unset", color: "unset", paddingTop: "0rem", paddingBottom: "0rem"}}>
                <Row style={{ backgroundColor: "transparent", border: "unset", color: "unset", maxHeight: "inherit", maxWidth: "inherit"}}>
                {props.infoLink !== undefined &&
                        <Card.Title style={{backgroundColor: "inherit", border: "inherit", color: "inherit", textAlign: "right", paddingLeft: "0.5rem", paddingTop: "0"}}>
                            <a onClick={e => e.stopPropagation()} href={props.infoLink} target="_blank" rel="noreferrer" className="c-tooltip">
                                <FontAwesomeIcon icon={faInfoCircle} style={{'color':props.IconColor}} />
                                <span className="c-tooltiptext">FHIR Docs</span>
                            </a>
                        </Card.Title>
                    }
                    <ListGroupItem style={{backgroundColor: "inherit", border: "inherit", color: "inherit"}}>
                        <Card.Title className="col" style={{ fontSize: props.titleSize, textAlign: "center" }}>{props.title}</Card.Title>
                    </ListGroupItem>
                </Row>
                <ListGroup>
                    {content !== undefined &&
                    <ListGroupItem style={{backgroundColor: "inherit", border: "inherit", color: "inherit"}}>
                        <Col md={{offset: "8"}}>
                            {content}
                        </Col>
                    </ListGroupItem>
                    }
                </ListGroup>
            </Card.Body>

            {props.cardImage &&
                <Card.Footer style={{border: "unset", backgroundColor: "transparent", textAlign: "center", padding: "0rem"}}>
                    <FontAwesomeIcon className="col pe-none" icon={props.cardImage} style={{'color':props.IconColor, 'height':props.IconSize}} />
                </Card.Footer>}
        </Card>
        </CSSTransition>
        );
    }

