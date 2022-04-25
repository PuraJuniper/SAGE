import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button, Card, InputGroup } from "react-bootstrap";
import { FieldHandlerProps, ICardForm } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps, displayBoxProps, dropdownBoxProps } from "./outerCardForm";
import { CodeableConceptEditorProps } from "./codeableConceptEditor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/pro-solid-svg-icons";

export class MedicationRequestForm implements ICardForm {

    resourceType;

    constructor(resourceType: FriendlyResourceProps) {
        this.resourceType = resourceType;
    }

    textBoxFields = new Map<string, textBoxProps>([
        ['title', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
        }],
        ['description', {
            boxSize: 3,
            isReadOnly: false,
            isLink: false,
            caption: ""
        }],
        ['resource', {
            boxSize: 1, 
            isReadOnly: false,
            isLink: false,
            caption: "Related Artifact must be a valid URL."
        }],
        ['text', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            autoGenFn: updateDosageAutofill

        }],
        ['frequency', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: "text"
        }],
        ['period', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: "text"
        }],
        ['value', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: ""
        }],
        ['unit', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: ""
        }],
        ['duration', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: "text"
        }]
    ]);

    dropdownFields = new Map<string, dropdownBoxProps>([
        ['status',
            { values: ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'] }],
        ['intent',
            { values: ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'] }],
        ['periodUnit',
            { values: ['h', 'd', 'wk', 'mo', 'a'] }],
        ['durationUnit',
            { values: ['h', 'd', 'wk', 'mo', 'a'] }],
        ['type',
            { values: ['documentation', 'justification', 'citation', 'predecessor', 'successor', 'derived-from', 'depends-on', 'composed-of'] }]
    ]);
    displayBoxFields = new Map<string, displayBoxProps>([
        ['title', {
            className: "display-page-title",
            displayFieldTitle: false,
        }],
        ['description', {
            className: "",
            displayFieldTitle: false,
        }],
        ['resource', {
            className: "",
            displayFieldTitle: true,
        }],
        ['text', {
            className: "",
            displayFieldTitle: true,

        }],
        ['frequency', {
            className: "display-page-dosage-small",
            displayFieldTitle: true,
        }],
        ['period', {
            className: "display-page-dosage-small",
            displayFieldTitle: true,
        }],
        ['value', {
            className: "display-page-dosage-medium",
            displayFieldTitle: true,
        }],
        ['unit', {
            className: "display-page-dosage-small",
            displayFieldTitle: true,
        }],
        ['productDescription', {
            className: "",
            displayFieldTitle: true,
        }],
        ['productReference', {
            className: "display-page-productRefernce",
            displayFieldTitle: true,
        }],
    ]);

    codeableConceptFields: Map<string, Partial<CodeableConceptEditorProps>> = new Map<string, Partial<CodeableConceptEditorProps>>([
        ['productCodeableConcept', {}]
    ]);

    resourceFields = ['dosage', 'timing', 'repeat', 'relatedArtifact', 'doseAndRate', 'doseQuantity'];

    cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'placeholder'],
                ['title', 'productCodeableConcept'],
                ['description', 'value'],
                ['status', 'unit'],
                ['intent','timing' ],
                ['resource','duration' ],
                ['type', 'text'],
                ['placeholder', 'placeholder'],
            ]

    };
                  
    cardDisplayLayout =
    {
        cardColumns: [
            ['title'],
            ['description'],
            ['value','unit','frequency','period','periodUnit'],
            ['resource'],
            ['text'],
        ]

    };




    pageOne: ICardForm['pageOne'] = (props) => {
        const placeHolderElem =
            <Form.Group className="page1-formgroup" key='placeholder-formGroup' as={Col}>
            </Form.Group>
        console.log(props)
        const timingElem =
        <Col className="page1-formgroup form-group"  key='timing-formGroup'>
            <Row style={{margin: '0'}}>
                <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap','justifyContent':'flex-end','flex': '0 0 90%'}} >
                    <span style={{ fontSize: "20px"}}>
                        <div className="page1-tooltip">
                            <FontAwesomeIcon icon={faInfoCircle} />
                            <Card className="page1-tooltiptext">
                                <div>E.g. 2 doses per day for a week would be expressed as:</div> 
                                <div style={{'margin': "10px 0px",'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end','flex': '0 0 90%'}} >
                                    <div className="page1-dosage-small-example">2</div>
                                    <div style={{'margin': "0 10px"}}>dose(s) every</div> 
                                    <div className="page1-dosage-small-example">1</div>
                                    <select className="page1-dosage-medium-example" disabled>
                                        <option value="">d</option>
                                    </select>          
                                </div>
                                <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end', 'flex': '0 0 90%'}} >
                                    <div style={{'margin': "0 10px"}}>for</div> 
                                    <div className="page1-dosage-small-example">1</div>
                                    <select className="page1-dosage-medium-example" disabled>
                                        <option value="">wk</option>
                                    </select>   
                                </div>
                            </Card>
                        </div>
                    </span>
                </div>
                <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end','flex': '0 0 90%'}} >
                    {props.fieldElements[0]}
                    <div style={{'margin': "0 10px"}}>dose(s) every</div> 
                    {props.fieldElements[1]}
                    {props.fieldElements[9]}
                </div>
            </Row>
        </Col>
        const durationElem =
        <Col className="page1-formgroup formGroup"  key='duration-formGroup'>
            <Row style={{margin: '0'}}>
                <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end', 'flex': '0 0 90%'}} >
                    <div style={{'margin': "0 10px"}}>for</div> 
                    {props.fieldElements[2]}
                    {props.fieldElements[10]}
                </div>
            </Row>
        </Col>

        return (
            <>{
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row style={{justifyContent: 'center'}} key={"row-" + i} >
                            {cr.map(field =>
                                [
                                    durationElem,
                                    timingElem,
                                    placeHolderElem,
                                    ...props.fieldElements
                                ].find(elem =>
                                    elem.key?.toString().startsWith(field + "-")))}
                        </Row>
                    )
                })
            }</>
        );
    }

    pageTwo: ICardForm['pageTwo'] = (props) => {
        return props.conditionEditor;
    }

    pageThree: ICardForm['pageThree'] = (props) => {
        const placeHolderElem =
            <Form.Group key='placeholder-formGroup' as={Col} >
            </Form.Group>;
        return (
            <div> {
                ...this.cardDisplayLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} className="mb-3">
                            {cr.map(field =>
                                [
                                    placeHolderElem,
                                    ...props.displayElements
                                ].find(elem =>
                                    elem.key?.toString().startsWith(field + "-")))}
                        </Row>
                    )
                })
            }</div>
        );
    }
}

function updateDosageAutofill(fieldHandlers: Map<string, FieldHandlerProps>): string {
    const fieldTriggers = ['frequency', 'period', 'periodUnit', 'duration', 'durationUnit'];
    const fieldVals = new Map(
        fieldTriggers.map(ft => { return [ft, fieldHandlers.get(ft)?.fieldContents] }));
    return fieldVals.get(fieldTriggers[0]) + fieldVals.get(fieldTriggers[1]) + fieldVals.get(fieldTriggers[3]);
}

