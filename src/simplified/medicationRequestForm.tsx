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
            caption: ""
        }],
        ['description', {
            boxSize: 4,
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
            caption: ""
        }],
        ['period', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: ""
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
        ['productDescription', {
            boxSize: 3,
            isReadOnly: false,
            isLink: false,
            caption: ""
        }],
        ['productReference', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: ""

        }]
    ]);

    dropdownFields = new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['periodUnit',
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
            className: "",
            displayFieldTitle: true,
        }],
        ['period', {
            className: "",
            displayFieldTitle: true,
        }],
        ['value', {
            className: "",
            displayFieldTitle: true,
        }],
        ['unit', {
            className: "",
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
                ['intent', 'frequency'],
                ['resource', 'period'],
                ['type', 'periodUnit'],
                ['placeholder', 'text'],
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
        return (
            <>{
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row style={{justifyContent: 'center'}} key={"row-" + i} >
                            {cr.map(field =>
                                [
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
