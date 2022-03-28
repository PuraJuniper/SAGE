import React, { useState } from "react";
import { Col, Form, ListGroup, Row, Button, Card, InputGroup } from "react-bootstrap";
import { EditableStateForCondition, ICardForm, AggregateType, WizExprAggregate } from "./cardEditor";
import { FriendlyResourceProps } from "./nameHelpers";
import { textBoxProps, displayBoxProps } from "./outerCardForm";
import { CqlWizardModal } from "./cql-wizard/cqlWizardModal"
import { PlanDefinitionActionCondition } from "fhir/r4";
import { CodeFilterType, DateFilterType, saveEditableStateForConditionId, WizardState } from "./cql-wizard/wizardLogic";
import { convertFormInputToNumber } from "./cql-wizard/cqlWizardSelectFilters";

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
            ['s', 'min', 'h', 'd', 'wk', 'mo', 'a']],
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
                ['type', 'period'],
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
            ['productReference','productDescription'],
            ['value','unit','frequency','period','periodUnit'],
            ['resource'],
            ['text'],
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

        // Various callbacks for CQL Wizard Dialog
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
            const newEditedState: EditableStateForCondition = {
                ...currentlyEditedState,
                curWizState: newWizState,
            }
            saveEditableStateForConditionId(currentlyEditedState.conditionId, newEditedState); // Temp
            props.persistEditedCondition(newEditedState)
            handleClose();
        }

        function handleConditionAggregate(draftCondition: EditableStateForCondition, newAggregate: WizExprAggregate) {
            saveEditableStateForConditionId(draftCondition.conditionId, {
                ...draftCondition,
                exprAggregate: newAggregate,
            }); // Temp
            props.persistEditedCondition({
                ...draftCondition,
                exprAggregate: newAggregate,
            });
        }

        return (
            <>
            <React.StrictMode>
                <CqlWizardModal show={showWiz} initialWizState={currentlyEditedState.curWizState} onClose={handleClose} onSaveAndClose={handleSaveAndClose} />
                <Button onClick={() => handleCreateExpression()} >
                    New Expression..
                </Button>
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
                                        {draft.curWizState.filters.flatMap(v => {
                                            switch(v.filter.type) {
                                                case "coding":
                                                    if (v.filter.filteredCoding.filterType === CodeFilterType.None) {
                                                        return [];
                                                    }
                                                    else {
                                                        const codes = v.filter.codeBinding.codes;
                                                        return [`${v.elementName} is one of [${v.filter.filteredCoding.selectedIndexes.map(index => codes[index].display ?? codes[index].code).join(', ')}]`];
                                                    }
                                                case "date":
                                                    if (v.filter.filteredDate.filterType === DateFilterType.None) {
                                                        return [];
                                                    }
                                                    else {
                                                        return ['some date (display WIP)'];
                                                    }
                                                default:
                                                    return [];
                                            }
                                        }).join(', and ')}
                                    </Card.Text>
                                    <Button onClick={() => handleEditExpression(draft)}>Edit</Button>
                                </Card.Body>
                                <Card.Footer>
                                    <div className="cql-wizard-result-should-exist">
                                        <Button variant="outline-danger" active={draft.exprAggregate.aggregate === AggregateType.DoesNotExist}
                                            onClick={()=>handleConditionAggregate(draft, { ...draft.exprAggregate, aggregate: AggregateType.DoesNotExist })}
                                        >
                                            Should Not Exist
                                        </Button>
                                        <Button variant="outline-success" active={draft.exprAggregate.aggregate === AggregateType.Exists}
                                            onClick={()=>handleConditionAggregate(draft, { ...draft.exprAggregate, aggregate: AggregateType.Exists })}
                                        >
                                            Should Exist
                                        </Button>
                                        <InputGroup>
                                            <InputGroup.Prepend>
                                                <Button variant="outline-primary" active={draft.exprAggregate.aggregate === AggregateType.AtLeast}
                                                    onClick={()=>handleConditionAggregate(draft, { ...draft.exprAggregate, aggregate: AggregateType.AtLeast })}
                                                >
                                                    At Least
                                                </Button>
                                                <Button variant="outline-primary" active={draft.exprAggregate.aggregate === AggregateType.NoMoreThan}
                                                    onClick={()=>handleConditionAggregate(draft, { ...draft.exprAggregate, aggregate: AggregateType.NoMoreThan })}
                                                >
                                                    No More Than
                                                </Button>
                                            </InputGroup.Prepend>
                                            <Form.Control
                                                placeholder="Count for aggregate"
                                                type="number"
                                                disabled={!([AggregateType.AtLeast, AggregateType.NoMoreThan].includes(draft.exprAggregate.aggregate))}
                                                defaultValue={1}
                                                min={0}
                                                onChange={e => handleConditionAggregate(draft, { aggregate: draft.exprAggregate.aggregate, count: convertFormInputToNumber(e.target.value, 1) })}
                                            />
                                        </InputGroup>
                                    </div>
                                </Card.Footer>
                            </Card>
                        ] : 
                        [];
                    })}
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
