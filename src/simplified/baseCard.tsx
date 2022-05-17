import React from 'react';
import {Button, Card, Container, Row} from "react-bootstrap";
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
    const [isClickable, setIsClickable] = useState(true);
    
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
            className={`raise-card-animation ${props.disabled ? "disabled-card" : ""}`}
            bg={props.bsBg}
            text={props.bsText as Color}
            border={props.bsBorder}
            onClick={isClickable ? props.onClick : () => void(0)}
        >
            <Card.Header style={headerPadding} hidden = {props.hideHeader}>
                {props.header}
            </Card.Header>
            <Card.Body>
                <Container>
                    <Row className="align-content-end">
                        {props.infoLink !== undefined ?
                                <span style={{ fontSize: "20px", textAlign: "right" }} onMouseEnter={() => setIsClickable(false)} onMouseLeave={() => setIsClickable(true)}>
                                <a href={props.infoLink} target="_blank" rel="noreferrer" className="c-tooltip">
                                    <FontAwesomeIcon icon={faInfoCircle} style={{'color':props.IconColor}} />
                                    <span className="c-tooltiptext">FHIR Docs</span>
                                </a>
                            </span> :
                            <div className="m-3" />}

                    </Row>
                    <Row className="align-content-center">
                        <Card.Title className="col" style={{ fontSize: props.titleSize, textAlign: "center" }}>{props.title}</Card.Title>
                    </Row>
                    <Row className="align-content-center">
                        <Card.Text className="col">{content}</Card.Text>
                    </Row>
                    <Row className="align-content-center">
                        <FontAwesomeIcon className="col pe-none" icon={props.cardImage} style={{'color':props.IconColor, 'height':props.IconSize}} />
                    </Row>
                </Container>
            </Card.Body>
        </Card>
        </CSSTransition>
        );
    }

