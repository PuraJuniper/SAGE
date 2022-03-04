import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button, Card, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { ICardForm } from "./cardEditor";
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
        enum ResourceCondition {
            Exists = "exists",
            DoesNotExist = "doesNotExist",
            AtLeast = "atLeast",
            NoMoreThan = "noMoreThan"
        }
        // The editable state for the Expression with id `exprId`
        interface EditableStateForCondition {
            curWizState: WizardState | null,
            outCondition: ResourceCondition,
            conditionId: string,
        }
        function createNewExpressionForWizard(numExpressions: number): EditableStateForCondition {
            return {
                curWizState: null,
                outCondition: ResourceCondition.Exists,
                conditionId: `index-${numExpressions + 1}`,
            };
        }
        function buildEditableStateFromCondition(condition: SageCondition): EditableStateForCondition {
            return {
                curWizState: buildWizStateFromCondition(condition),
                outCondition: ResourceCondition.Exists,
                conditionId: condition.id
            }
        }

        const [showWiz, setShowWiz] = useState(true);
        const [currentlyEditedState, setCurrentlyEditedState] = useState<EditableStateForCondition>(()=>createNewExpressionForWizard(props.conditions.length));
        const [existingConditions, setExistingConditions] = useState<SageCondition[]>(() => props.conditions.map((v, i): SageCondition => {
            return {
                ...v,
                id: v.id ?? `index-${i}`,
            }
        }));

        function handleEditExpression(editedExpr: EditableStateForCondition) {
            setCurrentlyEditedState(editedExpr);
            setShowWiz(true);
        }

        function handleCreateExpression() {
            setCurrentlyEditedState(createNewExpressionForWizard(existingConditions.length));
            setShowWiz(true);
        }

        function handleClose() {
            setShowWiz(false);
        }

        function handleSaveAndClose(newWizState: WizardState) {
            saveWizStateForConditionId(currentlyEditedState.conditionId, newWizState);
            const newSageCondition: SageCondition = {
                id: currentlyEditedState.conditionId,
                expression: {
                    language: 'cql-wizard',
                    expression: 'test expr',
                },
                kind: 'applicability',
            };
            if (!existingConditions.some(v=>v.id === currentlyEditedState.conditionId)) {
                setExistingConditions(existingConditions.concat([newSageCondition]));
            }
            else {
                setExistingConditions(existingConditions.map(v => (v.id !== currentlyEditedState.conditionId) ? v : newSageCondition))
            }
            handleClose();
        }

        return (
            <>
            <React.StrictMode>
                <CqlWizardModal show={showWiz} initialWizState={currentlyEditedState.curWizState} onClose={handleClose} onSaveAndClose={handleSaveAndClose} />
                <ListGroup>
                    {existingConditions.flatMap(v => {
                        const conditionAsSageExpression = buildEditableStateFromCondition(v);
                        return conditionAsSageExpression.curWizState !== null ? [
                            <Card key={v.id}>
                                <Card.Body>
                                    <Card.Title>{conditionAsSageExpression.curWizState.resType}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">{`With one of the codes ${conditionAsSageExpression.curWizState.codes.map(code=>code.code).join(', ')}`}</Card.Subtitle>
                                    <Card.Text>
                                        With the following restrictions:
                                        <br />
                                        {conditionAsSageExpression.curWizState.filters.map(v => {
                                            return (
                                                `${v.elementName} is ${v.filter.type === "coding" ? `one of ${v.filter.filteredCoding.selectedCodes.join(', ')}` : "some date" }`
                                            );
                                        }).join(', ')}
                                    </Card.Text>
                                    <Button onClick={() => handleEditExpression(conditionAsSageExpression)}>Edit</Button>
                                </Card.Body>
                                <Card.Footer>
                                <ToggleButtonGroup
                                    className="cql-wizard-result-should-exist"
                                    type="radio"
                                    name={`exists-filter`}
                                    value={"should-exist"}
                                >
                                    <ToggleButton variant="outline-success" value={"should-exist"}>Should Exist</ToggleButton>
                                    <ToggleButton variant="outline-danger" value={"should-not-exist"}>Should Not Exist</ToggleButton>
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
