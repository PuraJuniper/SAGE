import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button } from "react-bootstrap";
import { ICardForm } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps } from "./outerCardForm";
import { CqlWizardModal } from "./cql-wizard/CqlWizardModal"
import { Expression, Resource } from "fhir/r4";

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
        ['resource', {
            boxSize: 1, 
            isReadOnly: false,
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
        }],
        ['productDescription', {
            boxSize: 3,
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

    resourceFields = ['dosage', 'timing', 'repeat', 'relatedArtifact', 'doseAndRate', 'doseQuantity'];

    cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'placeholder'],
                ['title', 'productReference'],
                ['description', 'productDescription'],
                ['status', 'value'],
                ['intent', 'unit'],
                ['resource', 'frequency'],
                ['placeholder', 'period'],
                ['placeholder', 'periodUnit'],
                ['freeTextplaceholder', 'text'],
                ['placeholder', 'placeholder'],
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
            <Form.Group key='placeholder-formGroup' as={Col}>
            </Form.Group>;
        const freeTextplaceHolderElem =
            <Form.Group key='freeTextplaceholder-formGroup' as={Col} style={{'margin': 0, 'flex': '0 0 35%'}}>
            </Form.Group>;
        return (
            <>{
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} style={{'marginLeft': -100}}>
                            {cr.map(field =>
                                [
                                    freeTextplaceHolderElem,
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
        const [showWiz, setShowWiz] = useState(false);
        const [selectedExpr, setSelectedExpr] = useState<Expression | null>(null);

        function handleEditExpression(expr?: Expression) {
            if (!expr) {
                return;
            }
            setSelectedExpr(expr);
            setShowWiz(true);
        }

        function handleCreateExpression() {
            setSelectedExpr(null);
            setShowWiz(true);
        }

        function handleClose() {
            setShowWiz(false);
        }

        function handleSaveAndClose(expr?: Expression) {
            console.log(expr);
            handleClose();
        }

        return (
            <>
            <React.StrictMode>
                <CqlWizardModal show={showWiz} expression={selectedExpr} onClose={handleClose} onSaveAndClose={handleSaveAndClose}/>
                <ListGroup>
                    {props.conditions.map((v) => {
                        return v.expression?.expression ?
                            <ListGroup.Item
                                key={v.expression.expression} action
                                onClick={() => handleEditExpression(v.expression)}
                            >
                                {v}
                            </ListGroup.Item> :
                            undefined
                    })}
                    <Button
                        onClick={() => handleCreateExpression()}
                    >
                        New Expression..
                    </Button>
                </ListGroup>
            </React.StrictMode>
            </>
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
