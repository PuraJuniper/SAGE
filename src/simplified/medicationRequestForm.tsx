import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button, Card, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { EditableStateForCondition, ICardForm, ResourceCondition } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps } from "./outerCardForm";
import { CqlWizardModal } from "./cql-wizard/CqlWizardModal"
import { PlanDefinitionActionCondition } from "fhir/r4";
import { buildWizStateFromCondition, saveWizStateForConditionId, WizardState } from "./cql-wizard/wizardLogic";

// Make `id` a required property
export interface SageCondition extends PlanDefinitionActionCondition {
    id: NonNullable<PlanDefinitionActionCondition['id']>
}

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
        const [currentlyEditedState, setCurrentlyEditedState] = useState<EditableStateForCondition>(()=>props.generateNewCondition());

        // Handle open/close of CQL Wizard Dialog
        function handleEditExpression(editedExpr: EditableStateForCondition) {
            setCurrentlyEditedState(editedExpr);
            setShowWiz(true);
        }
        function handleCreateExpression() {
            setCurrentlyEditedState(props.generateNewCondition());
            setShowWiz(true);
        }
        function handleClose() {
            setShowWiz(false);
        }
        function handleSaveAndClose(newWizState: WizardState) {
            saveWizStateForConditionId(currentlyEditedState.conditionId, newWizState); // Temp
            props.persistEditedCondition({
                ...currentlyEditedState,
                curWizState: newWizState,
            })
            handleClose();
        }

        function handleResourceConditionChange(draftCondition: EditableStateForCondition, newResourceCondition: ResourceCondition) {
            props.persistEditedCondition({
                ...draftCondition,
                outCondition: newResourceCondition,
            });
        }

        return (
            <>
            <React.StrictMode>
                <CqlWizardModal show={showWiz} initialWizState={currentlyEditedState.curWizState} onClose={handleClose} onSaveAndClose={handleSaveAndClose} />
                <ListGroup>
                    {props.draftConditions.flatMap(draft => {
                        return draft.curWizState !== null ? [
                            <Card key={draft.conditionId}>
                                <Card.Body>
                                    <Card.Title>{draft.curWizState.resType}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">{`With one of the codes ${draft.curWizState.codes.map(code=>code.code).join(', ')}`}</Card.Subtitle>
                                    <Card.Text>
                                        With the following restrictions:
                                        <br />
                                        {draft.curWizState.filters.map(v => {
                                            return (
                                                `${v.elementName} is ${v.filter.type === "coding" ? `one of ${v.filter.filteredCoding.selectedCodes.join(', ')}` : "some date" }`
                                            );
                                        }).join(', ')}
                                    </Card.Text>
                                    <Button onClick={() => handleEditExpression(draft)}>Edit</Button>
                                </Card.Body>
                                <Card.Footer>
                                <ToggleButtonGroup
                                    className="cql-wizard-result-should-exist"
                                    type="radio"
                                    name={`${draft.conditionId}-exists-filter`}
                                    value={draft.outCondition}
                                    onChange={value=>handleResourceConditionChange(draft, value)}
                                >
                                    <ToggleButton variant="outline-success" value={ResourceCondition.Exists}>Should Exist</ToggleButton>
                                    <ToggleButton variant="outline-danger" value={ResourceCondition.DoesNotExist}>Should Not Exist</ToggleButton>
                                </ToggleButtonGroup>
                                </Card.Footer>
                            </Card>
                        ] : 
                        [];
                    })}
                    <Button onClick={() => handleCreateExpression()} >
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
