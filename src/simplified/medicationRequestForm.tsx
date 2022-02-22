import { Resource } from "fhir/r4";
import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import { ICardForm } from "./cardEditor";
import { FriendlyResourceListEntry } from "./nameHelpers";
import { textBoxProps } from "./outerCardForm";

export class MedicationRequestForm implements ICardForm {

    resourceType;

    constructor(resourceType: FriendlyResourceListEntry) {
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

        }]
    ]);

    dropdownFields = new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['productReference',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']]
    ]);

    groupedFields = new Map<string, string[]>([
        ['dosage',
            ['text', 'timing', 'frequency', 'period', 'periodUnit']] 
        //     ,
        // ['period',
        //     ['1', '2', '3', '4', '5', '6']],
        // ['periodUnit',
        //     ['s', 'min', 'h', 'd', 'wk', 'mon']],
        // ['frequency', {
        //     boxSize: 1,
        //     isReadOnly: false,
        //     isLink: false,
        //     caption: "huh"

        // }]
    ]);

    cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'productReference'],
                ['title', 'period'],
                ['description', 'placeholder'],
                ['status', 'frequency'],
                ['intent', 'placeholder'],
                ['relatedArtifact', 'placeholder'],
                ['placeholder', 'placeholder'],
                ['placeholder', 'text']
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


    pageThree = (fieldElements: JSX.Element[]) => {
        return (
            [
                <div key="page2">To be implemented</div>
            ]
        );
    }
}