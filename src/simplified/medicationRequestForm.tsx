import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button, Card, InputGroup } from "react-bootstrap";
import { ICardForm } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps, displayBoxProps } from "./outerCardForm";
import { CodeableConceptEditorProps } from "./codeableConceptEditor";

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
            caption: ""
        }],
        ['text', {
            boxSize: 1,
            isReadOnly: true,
            isLink: false,
            caption: ""

        }],
        ['frequency', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
        }],
        ['period', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
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
        }]
    ]);

    dropdownFields = new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['periodUnit',
            ['h', 'd', 'wk', 'mo', 'a']],
        ['durationUnit',
            ['h', 'd', 'wk', 'mo', 'a']],
        ['type',
            ['documentation', 'justification', 'citation', 'predecessor', 'successor', 'derived-from', 'depends-on', 'composed-of']]
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
            </Form.Group>;
        console.log(props)
        const timingElem =
        <Col className="page1-formgroup formGroup"  key='timing-formGroup'>
            <label htmlFor="">E.g. 2 doses per day for a week would be enterd as:</label>
            <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end'}} >
                {props.fieldElements[0]}
                dose(s) every 
                {props.fieldElements[1]}
                {props.fieldElements[9]}
            </div>
        </Col>
        const durationElem =
        <Col className="page1-formgroup formGroup"  key='duration-formGroup'>
            <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end'}} >
                for
                {props.fieldElements[2]}
                {props.fieldElements[10]}
            </div>
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
