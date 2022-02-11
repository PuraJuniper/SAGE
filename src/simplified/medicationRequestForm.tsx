import React, { ElementType } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
// import { simpleCardField } from "./cardEditor";
import { CardFormProps, CardFormState, cardLayout, textBoxProps } from "./cardForm";
import { FriendlyResourceFormElement, getFormElementListForResource } from "./nameHelpers";

    export const textBoxFields: Map<string, textBoxProps>= new Map<string, textBoxProps>([
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

    export const dropdownFields: Map<string, string[]>= new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['productReference',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']]
    ]);

    export const cardFieldLayout: cardLayout=
    {
        cardColumns: [
            ['placeholder', 'productReference'],
            ['title', 'placeholder'],
            ['description', 'placeholder'],
            ['status', 'placeholder'],
            ['intent', 'placeholder'],
            ['relatedArtifact', 'placeholder'],
            ['placeholder'],
            ['placeholder', 'text']
        ]

    };

    export const placeHolderElem: JSX.Element = 
    <Form.Group key='placeholder-formGroup' as={Col} >
    </Form.Group>;
        

    export const pageOne = (fieldElements: JSX.Element[]): JSX.Element[] => {
        return (
            [
                ...cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} className="mb-3">
                            {cr.map(field =>
                                [
                                    placeHolderElem,
                                    ...fieldElements
                                ].find(elem =>
                                    elem.key?.toString().startsWith(field + "-")))}
                        </Row>
                    )
                }),
            ]
        );
    }