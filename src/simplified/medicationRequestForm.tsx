import { Resource } from "fhir/r4";
import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import { ICardForm } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps } from "./outerCardForm";

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
            boxSize: 3,
            isReadOnly: false,
            isLink: false,
            caption: ""
        }],
        ['relatedArtifact', {
            boxSize: 1, 
            isReadOnly: true,
            isLink: false,
            caption: ""
        }],
        ['text', {
            boxSize: 4,
            isReadOnly: false,
            isLink: false,
            caption: "NOTE: For advanced timing instructions, leave basic dosage sentence blank."

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
        }]
    ]);

    dropdownFields = new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['productReference',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['periodUnit',
            ['s', 'min', 'h', 'd', 'wk', 'mo', 'a']]
    ]);

    resourceFields = ['dosage', 'timing', 'repeat'];

    cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'productReference'],
                ['title', 'value'],
                ['description', 'unit'],
                ['status', 'placeholder'],
                ['intent', 'period'],
                ['relatedArtifact', 'frequency'],
                ['placeholder', 'placeholder'],
                ['periodUnit', 'text']
            ]

    };
                  
    cardDisplayLayout =
    {
        cardColumns: [
            ['title'],
            ['description'],
            ['relatedArtifact'],
            ['productReference'],
            ['text']
        ]

    };




    pageOne: ICardForm['pageOne'] = (props) => {
        const placeHolderElem =
            <Form.Group key='placeholder-formGroup' as={Col} >
            </Form.Group>;
        return (
            <div>{
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} className="mb-3">
                            {cr.map(field =>
                                [
                                    placeHolderElem,
                                    ...props.fieldElements
                                ].find(elem =>
                                    elem.key?.toString().startsWith(field + "-")))}
                        </Row>
                    )
                })
            }</div>
        );
    }

    pageTwo: ICardForm['pageTwo'] = (props) => {
        return (
            <div key="page2">{props.conditions}</div>
        );
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
