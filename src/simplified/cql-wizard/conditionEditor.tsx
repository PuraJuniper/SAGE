import { PlanDefinitionActionCondition } from "fhir/r4";
import React, { useState } from "react";
import { Button, ListGroup, Card, InputGroup, Form } from "react-bootstrap";
import { CqlWizardModal } from "./cqlWizardModal";
import { convertFormInputToNumber } from "./cqlWizardSelectFilters";
import {  buildEditableStateFromCondition, CodeFilterType, DateFilterType, saveEditableStateForConditionId, WizardState } from "./wizardLogic";
import * as SchemaUtils from "../../helpers/schema-utils";

/**
 * Types required for the condition editor
 */
 export enum AggregateType {
    Exists = "exists",
    DoesNotExist = "doesNotExist",
    AtLeast = "atLeast",
    NoMoreThan = "noMoreThan"
}
export interface WizExprAggregate {
    aggregate: AggregateType,
    count?: number,
}
// An editable state for the Condition with id `conditionId`
export interface EditableStateForCondition {
    curWizState: WizardState | null,
    exprAggregate: WizExprAggregate,
    conditionId: string,
}

// Make `id` a required property
export interface SageCondition extends PlanDefinitionActionCondition {
    id: NonNullable<PlanDefinitionActionCondition['id']>
}

interface ConditionEditorProps {
    pdConditions: PlanDefinitionActionCondition[],
    setPdConditions: (newConditions: PlanDefinitionActionCondition[]) => void,
}

export const ConditionEditor: React.FC<ConditionEditorProps> = (props) => {

    /**
     * Read PD conditions into a format editable by the condition editor
     */
     const [draftConditions, setDraftConditions] = useState<EditableStateForCondition[]>(()=>{

        // Set ids for each condition, if one does not already exist
        const pdSageConditions: SageCondition[] = props.pdConditions.map((v, i) => {
            return {
                ...v,
                id: v.id ?? `index-${SchemaUtils.getNextId()}`, // Need some unique id
            }
        });

        // Return each condition as a format compatible with the condition editor
        return pdSageConditions.map(v=>buildEditableStateFromCondition(v))
    });
    /**
     * Create callbacks for persisting edits to a condition and for generating a brand new condition
     */
    const persistEditableCondition = (newConditionState: EditableStateForCondition) => {
        setDraftConditions(curEditableConditions => {
            if (!curEditableConditions.some(v=>v.conditionId === newConditionState.conditionId)) {
                // Condition is brand new, add to our draft conditions
                return curEditableConditions.concat([newConditionState])
            }
            else {
                // Condition already exists in drafts, so update its draft
                return curEditableConditions.map(v => (v.conditionId !== newConditionState.conditionId) ? v : newConditionState)
            }
        });
    }
    const generateEditableCondition = (): EditableStateForCondition => { // Creating a new condition with default values
        return {
            curWizState: null,
            exprAggregate: {
                aggregate: AggregateType.Exists,
            },
            conditionId: `index-${SchemaUtils.getNextId()}`, // Need some unique id
        };
    }

    const [showWiz, setShowWiz] = useState(false);
    const [currentlyEditedState, setCurrentlyEditedState] = useState<EditableStateForCondition>(()=>generateEditableCondition());

    // Various callbacks for CQL Wizard Dialog
    function handleEditExpression(editedExpr: EditableStateForCondition) {
        setCurrentlyEditedState(editedExpr);
        setShowWiz(true);
    }
    function handleCreateExpression() {
        const newEditableState = generateEditableCondition();
        setCurrentlyEditedState(newEditableState);
        setShowWiz(true);
    }
    function handleClose() {
        setShowWiz(false);
    }
    function handleSaveAndClose(newWizState: WizardState) {
        const newEditableState: EditableStateForCondition = {
            ...currentlyEditedState,
            curWizState: newWizState,
        }
        saveEditableStateForConditionId(currentlyEditedState.conditionId, newEditableState); // Temp
        persistEditableCondition(newEditableState);
        const newCondition: SageCondition = {
            id: newEditableState.conditionId,
            expression: {
                language: "text/cql",
                expression: newEditableState.conditionId,
            },
            kind: "applicability",
        }
        const updateCondIdx = props.pdConditions.findIndex(v => v.id === newCondition.id);
        if (updateCondIdx === -1) {
            props.setPdConditions(props.pdConditions.concat(newCondition));
        }
        else {
            props.setPdConditions(props.pdConditions.map((v, i) => i === updateCondIdx ? newCondition : v))
        }
        handleClose();
    }

    function handleConditionAggregate(draftCondition: EditableStateForCondition, newAggregate: WizExprAggregate) {
        saveEditableStateForConditionId(draftCondition.conditionId, {
            ...draftCondition,
            exprAggregate: newAggregate,
        }); // Temp
        persistEditableCondition({
            ...draftCondition,
            exprAggregate: newAggregate,
        });
    }

    return (
        <div>
        <React.StrictMode>
            <CqlWizardModal show={showWiz} initialWizState={currentlyEditedState.curWizState} onClose={handleClose} onSaveAndClose={handleSaveAndClose} />

            <ListGroup>
                {draftConditions.flatMap(draft => {
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
        </div>
    )
}